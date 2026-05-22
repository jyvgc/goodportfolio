"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Company {
  uid: string;
  email: string;
  displayName: string;
  isApproved: boolean;
  createdAt: any;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchCompanies();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchCompanies = async () => {
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "company")));
    setCompanies(snap.docs.map((d) => d.data() as Company));
  };

  const handleApprove = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { isApproved: true });
    setCompanies((prev) => prev.map((c) => c.uid === uid ? { ...c, isApproved: true } : c));
    toast.success("기업 계정을 승인했습니다!");
  };

  const handleReject = async (uid: string) => {
    if (!confirm("승인을 거절하시겠습니까?")) return;
    await updateDoc(doc(db, "users", uid), { isApproved: false });
    toast.success("승인을 거절했습니다.");
  };

  const filtered = companies.filter((c) => {
    if (filter === "pending") return !c.isApproved;
    if (filter === "approved") return c.isApproved;
    return true;
  });

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>기업 승인</span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>기업 계정 승인</h1>

        {/* 필터 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { key: "pending", label: `승인 대기 (${companies.filter(c => !c.isApproved).length})` },
            { key: "approved", label: `승인 완료 (${companies.filter(c => c.isApproved).length})` },
            { key: "all", label: `전체 (${companies.length})` },
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p style={{ color: "#9999bb" }}>해당하는 기업이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((c) => (
              <div key={c.uid} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.displayName || "이름 없음"}</div>
                  <div style={{ color: "#9999bb", fontSize: 13 }}>{c.email}</div>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: c.isApproved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color: c.isApproved ? "#10b981" : "#f59e0b",
                }}>
                  {c.isApproved ? "승인 완료" : "대기 중"}
                </span>
                {!c.isApproved && (
                  <button onClick={() => handleApprove(c.uid)} style={{
                    padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: "#6366f1", color: "white", border: "none", cursor: "pointer",
                  }}>✓ 승인하기</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
