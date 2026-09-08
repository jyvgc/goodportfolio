import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(status: number, ok = false) {
  return NextResponse.json({ ok }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.get("authorization") || "");
  if (!match || match[1].length > 8192) return reply(401);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return reply(503);
  try {
    const { adminAuth, adminDb } = getAdminServices();
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(match[1], true)).uid; }
    catch { return reply(401); }
    const account = await adminAuth.getUser(uid);
    const age = Date.now() - Date.parse(account.metadata.creationTime);
    // Only new, enabled email/password registrations, not arbitrary old accounts.
    if (account.disabled || !Number.isFinite(age) || age < 0 || age > 86400000
      || !account.providerData.some((p) => p.providerId === "password")) return reply(403);
    const u = (await adminDb.doc(`users/${uid}`).get()).data();
    if (!u || !["student", "company"].includes(u.role)
      || u.uid !== uid || u.email !== account.email || u.isActive === false) return reply(403);
    const profileCollection = u.role === "student" ? "studentProfiles" : "companyProfiles";
    const profile = await adminDb.doc(`${profileCollection}/${uid}`).get();
    if (!profile.exists) return reply(409);

    // These collections MUST be denied to all client reads/writes in Rules.
    const state = adminDb.doc(`_registrationNotificationState/${uid}`);
    const hour = Math.floor(Date.now() / 3600000);
    const quota = adminDb.doc(`_registrationNotificationQuota/${hour}`);
    const claim = await adminDb.runTransaction(async (tx) => {
      const s = (await tx.get(state)).data();
      const q = (await tx.get(quota)).data();
      const now = Date.now();
      if (s?.status === "sent") return "sent";
      if ((s?.attempts || 0) >= 3 || now - (s?.lastAttempt || 0) < 60000
        || (q?.count || 0) >= 30) return "limited";
      tx.set(state, { status: "pending", attempts: (s?.attempts || 0) + 1, lastAttempt: now });
      tx.set(quota, { count: (q?.count || 0) + 1 });
      return "claimed";
    });
    if (claim === "sent") return reply(200, true);
    if (claim !== "claimed") return reply(429);
    // No names, email addresses, phone numbers, or user-provided HTML transmitted.
    const text = u.role === "student"
      ? "🎨 새 학생 가입\n관리자 페이지에서 확인해 주세요.\nhttps://goodportfolio-five.vercel.app/admin/students"
      : "🏢 새 기업 가입 (승인 필요)\n관리자 페이지에서 확인해 주세요.\nhttps://goodportfolio-five.vercel.app/admin/companies";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }), signal: controller.signal,
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok || result.ok !== true) {
        await state.update({ status: "failed" });
        return reply(502);
      }
      await state.update({ status: "sent" });
      return reply(200, true);
    } catch {
      // A timeout may mean delivery is uncertain; no automatic retry.
      await state.update({ status: "uncertain" });
      return reply(502);
    } finally { clearTimeout(timeout); }
  } catch {
    // Do not log exceptions containing Telegram URL credentials.
    console.error("Registration notification server operation failed");
    return reply(500);
  }
}
