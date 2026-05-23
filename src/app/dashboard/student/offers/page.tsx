"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getOffersForStudent, respondToOffer } from "@/lib/firestore";
import type { Offer } from "@/types";
import toast from "react-hot-toast";

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:        { label: "대기 중",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    pending_admin:  { label: "검토 중",     color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    admin_rejected: { label: "제안 거절됨", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    accepted:       { label: "수락",        color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    declined:       { label: "거절",        color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };
  return map[status] ?? { label: status || "알 수 없음", color: "#55556e", bg: "rgba(85,85,110,0.1)" };
};

export default function OffersPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (firebaseUser) {
      getOffersForStudent(firebaseUser.uid).then(setOffers);
    }
  }, [firebaseUser, loading, router]);

  const handleRespond = async (id: string, status: "accepted" | "declined") => {
    await respondToOffer(id, status);
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    toast.success(status === "accepted" ? "제안을 수락했습니다!" : "제안을 거절했습니다.");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/student" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 대시보드</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>채용 제안</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>채용 제안</h1>
        <p style={{ color: "#9999bb", marginBottom: 32 }}>총 {offers.length}건의 제안</p>

        {offers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
            <p style={{ color: "#9999bb" }}>아직 받은 채용 제안이 없습니다.</p>
            <p style={{ color: "#55556e", fontSize: 14, marginTop: 8 }}>포트폴리오를 공개하면 기업에서 제안을 보내드립니다!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {offers.map((offer) => {
              const s = getStatusLabel(offer.status);
              return (
                <div key={offer.id} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{offer.jobTitle}</div>
                      <div style={{ color: "#9999bb", fontSize: 14 }}>{offer.employmentType}</div>
                    </div>
                    <span style={{ padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ background: "#1a1a24", borderRadius: 12, padding: 16, color: "#9999bb", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                    {offer.message}
                  </div>

                  {offer.status === "pending" && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => handleRespond(offer.id, "accepted")} style={{
                        flex: 1, padding: "10px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        background: "#6366f1", color: "white", border: "none", cursor: "pointer",
                      }}>✓ 수락하기</button>
                      <button onClick={() => handleRespond(offer.id, "declined")} style={{
                        flex: 1, padding: "10px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                        background: "rgba(239,68,68,0.1)", color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
                      }}>✕ 거절하기</button>
                    </div>
                  )}

                  {offer.status === "pending_admin" && (
                    <p style={{ color: "#818cf8", fontSize: 13 }}>ℹ️ 관리자 검토 중입니다. 승인 후 수락/거절이 가능합니다.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
