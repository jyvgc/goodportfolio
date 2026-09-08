import { auth } from "@/lib/firebase";

// Optional argument retained for older callers; messages are never trusted/sent.
export async function notifyAdmin(_legacyMessage?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/registration-notification", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) console.warn("가입은 완료되었지만 관리자 알림이 전송되지 않았습니다.", res.status);
  } catch {
    console.warn("가입은 완료되었지만 관리자 알림 요청에 실패했습니다.");
  } finally { clearTimeout(timeout); }
}
