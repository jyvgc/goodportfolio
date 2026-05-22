"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Student {
  uid: string;
  email: string;
  displayName: string;
  isApproved: boolean;
  createdAt: any;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchStudents();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchStudents = async () => {
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    setStudents(snap.docs.map((d) => d.data() as Student));
  };

  const toggleApproval = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, "users", uid), { isApproved: !current });
    setStudents((prev) => prev.map((s) => s.uid === uid ? { ...s, isApproved: !current } : s));
    toast.success(current ? "계정을 비활성화했습니다." : "계정을 활성화했습니다.");
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "users", uid));
    setStudents((prev) => prev.filter((s) => s.uid !== uid));
    toast.success("계정이 삭제되었습니다.");
  };

  const filtered = students.filter((s) =>
    s.displayName?.includes(search) || s.email?.includes(search)
  );

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>학생 관리</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>학생 관리 <span style={{ color: "#6366f1" }}>({filtered.length}명)</span></h1>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 또는 이메일 검색..." style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 16px", borderRadius: 8, fontSize: 14, outline: "none", width: 280 }} />
        </div>

        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, overflow: "hidden" }}>
          {/* 테이블 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 16, padding: "12px 20px", background: "#1a1a24", borderBottom: "1px solid #2e2e3f" }}>
            {["이름", "이메일", "상태", "관리"].map((h) => (
              <div key={h} style={{ fontSize: 12, fontWeight: 600, color: "#55556e", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#55556e" }}>등록된 학생이 없습니다.</div>
          ) : (
            filtered.map((s, i) => (
              <div key={s.uid} style={{
                display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 16,
                padding: "16px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #1a1a24" : "none",
                alignItems: "center",
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.displayName || "-"}</div>
                <div style={{ color: "#9999bb", fontSize: 13 }}>{s.email}</div>
                <div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: s.isApproved ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    color: s.isApproved ? "#10b981" : "#f87171",
                  }}>
                    {s.isApproved ? "활성" : "비활성"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => toggleApproval(s.uid, s.isApproved)} style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: s.isApproved ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    color: s.isApproved ? "#f87171" : "#10b981",
                    border: s.isApproved ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  }}>
                    {s.isApproved ? "비활성화" : "활성화"}
                  </button>
                  <Link href={`/portfolio/${s.uid}`} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, background: "#1a1a24", color: "#9999bb", border: "1px solid #2e2e3f", textDecoration: "none" }}>
                    보기
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
