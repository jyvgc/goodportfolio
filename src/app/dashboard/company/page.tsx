"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getOffersFromCompany } from "@/lib/firestore";
import type { Offer } from "@/types";

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:        { label: "대기 중",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    pending_admin:  { label: "검토 중",     color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    admin_rejected: { label: "거절됨",      color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    accepted:       { label: "수락",        color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    declined:       { label: "거절",        color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };
  return map[status] ?? { label: "알 수 없음", color: "#55556e", bg: "rgba(85,85,110,0.1)" };
};

export default function CompanyDashboard() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (!loading && userDoc?.role !== "company") { router.push("/"); return; }
    if (!loading && userDoc && !userDoc.isApproved) { router.push("/auth/pending"); return; }
    if (firebaseUser) {
      getOffersFromCompany(firebaseUser.uid).then(setOffers);
    }
  }, [firebaseUser, userDoc, loading, router]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
      로딩 중...
    </div>
  );

  const pending  = offers.filter((o) => o.status === "pending").length;
  const accepted = offers.filter((o) => o.status === "accepted").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* 상단 바 */}
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 900, fontSize: 12 }}>G</span>
            </div>
            <span style={{ fontWeight: 800, color: "#f0f0ff" }}>Good<span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Portfolio</span></span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#9999bb", fontSize: 14 }}>{userDoc?.displayName}님</span>
            <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}>기업 HR</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          안녕하세요, <span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userDoc?.displayName}</span>님 👋
        </h1>
        <p style={{ color: "#9999bb", marginBottom: 40 }}>인재를 발굴하고 채용 제안을 관리하세요</p>

        {/* 요약 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "발송한 제안", value: offers.length, color: "#818cf8", icon: "📨" },
            { label: "수락된 제안", value: accepted,      color: "#10b981", icon: "✅" },
            { label: "대기 중",    value: pending,        color: "#f59e0b", icon: "⏳" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ color: "#55556e", fontSize: 12 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { href: "/gallery",                   icon: "🔍", label: "학생 검색", desc: "갤러리에서 인재를 찾아보세요" },
            { href: "/dashboard/company/offers",  icon: "📋", label: "제안 관리", desc: `${offers.length}건의 제안 현황 확인` },
          ].map((m) => (
            <Link key={m.href} href={m.href} style={{
              background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16,
              padding: 24, textDecoration: "none", display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.3s",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2e2e3f";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1a1a24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#f0f0ff", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 13, color: "#55556e" }}>{m.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#55556e" }}>→</span>
            </Link>
          ))}
        </div>

        {/* 최근 제안 목록 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16 }}>최근 발송한 제안</h2>
            <Link href="/dashboard/company/offers" style={{ color: "#818cf8", fontSize: 13, textDecoration: "none" }}>전체 보기 →</Link>
          </div>
          {offers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📨</div>
              <p style={{ color: "#9999bb", marginBottom: 8 }}>아직 발송한 채용 제안이 없습니다.</p>
              <Link href="/gallery" style={{ color: "#818cf8", fontSize: 14 }}>갤러리에서 학생 찾기 →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {offers.slice(0, 5).map((offer) => {
                const s = getStatusLabel(offer.status);
                return (
                  <div key={offer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a24", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{offer.jobTitle}</div>
                      <div style={{ fontSize: 12, color: "#9999bb" }}>{offer.employmentType}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
