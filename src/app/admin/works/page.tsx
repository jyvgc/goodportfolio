"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Work {
  id: string;
  title: string;
  category: string;
  images: string[];
  authorUid: string;
  isPublic: boolean;
  viewCount: number;
}

export default function AdminWorksPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchWorks();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchWorks = async () => {
    const snap = await getDocs(collection(db, "works"));
    setWorks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work)));
  };

  const togglePublic = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "works", id), { isPublic: !current });
    setWorks((prev) => prev.map((w) => w.id === id ? { ...w, isPublic: !current } : w));
    toast.success(current ? "작품을 숨겼습니다." : "작품을 공개했습니다.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "works", id));
    setWorks((prev) => prev.filter((w) => w.id !== id));
    toast.success("작품이 삭제되었습니다.");
  };

  const filtered = works.filter((w) => w.title?.includes(search));

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>작품 관리</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>작품 관리 <span style={{ color: "#10b981" }}>({filtered.length}개)</span></h1>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="작품명 검색..." style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 16px", borderRadius: 8, fontSize: 14, outline: "none", width: 240 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map((w) => (
            <div key={w.id} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ aspectRatio: "1", background: "#1a1a24", position: "relative" }}>
                {w.images?.[0]
                  ? <img src={w.images[0]} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎨</div>
                }
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                  background: w.isPublic ? "rgba(16,185,129,0.8)" : "rgba(239,68,68,0.8)",
                  color: "white",
                }}>{w.isPublic ? "공개" : "숨김"}</div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                <div style={{ color: "#55556e", fontSize: 11, marginBottom: 10 }}>{w.category} · 조회 {w.viewCount || 0}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => togglePublic(w.id, w.isPublic)} style={{
                    flex: 1, padding: "7px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: w.isPublic ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    color: w.isPublic ? "#f87171" : "#10b981",
                    border: w.isPublic ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  }}>{w.isPublic ? "숨기기" : "공개"}</button>
                  <button onClick={() => handleDelete(w.id)} style={{
                    flex: 1, padding: "7px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)",
                  }}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
