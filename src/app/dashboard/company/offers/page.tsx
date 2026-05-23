"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getOffersFromCompany } from "@/lib/firestore";
import type { Offer } from "@/types";

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:        { label: "학생 응답 대기", color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    pending_admin:  { label: "관리자 검토 중", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    admin_rejected: { label: "관리자 거절",    color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    accepted:       { label: "학생 수락",      color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    declined:       { label: "학생 거절",      color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };
  return map[status] ?? { label: status || "알 수 없음", color: "#55556e", bg: "rgba(85,85,110,0.1)" };
};

export default function CompanyOffersPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "pending_admin" | "accepted" | "declined">("all");

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (!loading && userDoc?.role !== "company") { router.push("/"); return; }
    if (firebaseUser) {
      getOffersFromCompany(firebaseUser.uid).then(setOffers);
    }
  }, [firebaseUser, userDoc, loading, router]);

  const filtered = filter === "all" ? offers : offers.filter((o) => o.status === filter);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/company" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 대시보드</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>제안 관리</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>채용 제안 관리</h1>

        {/* 필터 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { key: "all",           label: `전체 (${offers.length})` },
            { key: "pending_admin", label: `검토 중 (${offers.filter(o => o.status === "pending_admin").length})` },
            { key: "pending",       label: `응답 대기 (${offers.filter(o => o.status === "pending").length})` },
            { key: "accepted",      label: `수락 (${offers.filter(o => o.status === "accepted").length})` },
            { key: "declined",      label: `거절 (${offers.filter(o => o.status === "declined").length})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} style={{
              padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === f.key ? "none" : "1px solid #2e2e3f",
              background: filter === f.key ? "#6366f1" : "#111118",
              color: filter === f.key ? "white" : "#9999bb",
            }}>{f.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
            <p style={{ color: "#9999bb" }}>해당하는 제안이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((offer) => {
              const s = getStatusLabel(offer.status);
              return (
                <div key={offer.id} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{offer.jobTitle}</div>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, background: "#1a1a24", color: "#9999bb", border: "1px solid #2e2e3f" }}>
                        {offer.employmentType}
                      </span>
                    </div>
                    <span style={{ padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ background: "#1a1a24", borderRadius: 10, padding: 16, color: "#9999bb", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                    {offer.message}
                  </div>
                  <Link href={`/portfolio/${offer.toStudentUid}`} style={{ color: "#818cf8", fontSize: 13, textDecoration: "none" }}>
                    학생 포트폴리오 보기 →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
