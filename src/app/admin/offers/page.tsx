"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Offer {
  id: string;
  fromCompanyUid: string;
  toStudentUid: string;
  jobTitle: string;
  employmentType: string;
  message: string;
  status: string;
  adminApproved: boolean;
  createdAt: any;
}

export default function AdminOffersPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState<"pending_admin" | "approved" | "all">("pending_admin");

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchOffers();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchOffers = async () => {
    try {
      const snap = await getDocs(query(collection(db, "offers")));
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer)));
    } catch {
      const snap = await getDocs(collection(db, "offers"));
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer)));
    }
  };

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, "offers", id), { adminApproved: true, status: "pending" });
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, adminApproved: true, status: "pending" } : o));
    toast.success("채용 제안을 승인했습니다. 학생이 확인할 수 있습니다.");
  };

  const handleReject = async (id: string) => {
    if (!confirm("이 채용 제안을 거절하시겠습니까?")) return;
    await updateDoc(doc(db, "offers", id), { adminApproved: false, status: "admin_rejected" });
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status: "admin_rejected" } : o));
    toast.success("채용 제안을 거절했습니다.");
  };

  const filtered = offers.filter((o) => {
    if (filter === "pending_admin") return !o.adminApproved && o.status !== "admin_rejected";
    if (filter === "approved") return o.adminApproved;
    return true;
  });

  const statusLabel = (o: Offer) => {
    if (o.status === "admin_rejected") return { label: "관리자 거절", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    if (!o.adminApproved) return { label: "승인 대기", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    if (o.status === "accepted") return { label: "학생 수락", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    if (o.status === "declined") return { label: "학생 거절", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    return { label: "학생 응답 대기", color: "#818cf8", bg: "rgba(129,140,248,0.1)" };
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>채용 제안 관리</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>채용 제안 관리</h1>
        <p style={{ color: "#9999bb", fontSize: 13, marginBottom: 24 }}>기업이 보낸 채용 제안을 검토 후 승인하면 학생에게 전달됩니다.</p>

        {/* 필터 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { key: "pending_admin", label: `승인 대기 (${offers.filter(o => !o.adminApproved && o.status !== "admin_rejected").length})` },
            { key: "approved", label: `승인 완료 (${offers.filter(o => o.adminApproved).length})` },
            { key: "all", label: `전체 (${offers.length})` },
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
            <p style={{ color: "#9999bb" }}>해당하는 채용 제안이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((offer) => {
              const s = statusLabel(offer);
              return (
                <div key={offer.id} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{offer.jobTitle}</div>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, background: "#1a1a24", color: "#9999bb", border: "1px solid #2e2e3f" }}>{offer.employmentType}</span>
                    </div>
                    <span style={{ padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                  </div>

                  <div style={{ background: "#1a1a24", borderRadius: 10, padding: 16, color: "#9999bb", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                    {offer.message}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <Link href={`/portfolio/${offer.toStudentUid}`} style={{ color: "#818cf8", fontSize: 13, textDecoration: "none" }}>학생 포트폴리오 →</Link>
                    </div>
                    {!offer.adminApproved && offer.status !== "admin_rejected" && (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => handleReject(offer.id)} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}>거절</button>
                        <button onClick={() => handleApprove(offer.id)} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#6366f1", color: "white", border: "none", cursor: "pointer" }}>✓ 학생에게 전달</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
