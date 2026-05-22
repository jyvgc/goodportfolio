"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getWorksByAuthor, deleteWork } from "@/lib/firestore";
import type { Work } from "@/types";
import toast from "react-hot-toast";

export default function WorksPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (firebaseUser) {
      getWorksByAuthor(firebaseUser.uid).then(setWorks);
    }
  }, [firebaseUser, loading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteWork(id);
    setWorks((prev) => prev.filter((w) => w.id !== id));
    toast.success("작품이 삭제되었습니다.");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
      로딩 중...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* 상단 바 */}
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard/student" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 대시보드</Link>
            <span style={{ color: "#2e2e3f" }}>/</span>
            <span style={{ color: "#9999bb", fontSize: 14 }}>작품 목록</span>
          </div>
          <Link href="/dashboard/student/works/new" style={{
            background: "#6366f1", color: "white", padding: "8px 20px",
            borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600,
          }}>+ 새 작품 업로드</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>내 작품 목록</h1>

        {works.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <p style={{ color: "#9999bb", marginBottom: 24 }}>아직 등록된 작품이 없습니다.</p>
            <Link href="/dashboard/student/works/new" style={{
              background: "#6366f1", color: "white", padding: "12px 32px",
              borderRadius: 8, textDecoration: "none", fontWeight: 600,
            }}>첫 작품 업로드하기</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {works.map((w) => (
              <div key={w.id} style={{
                background: "#111118", border: "1px solid #2e2e3f",
                borderRadius: 16, overflow: "hidden",
              }}>
                {/* 썸네일 */}
                <div style={{ aspectRatio: "1", background: "#1a1a24", position: "relative" }}>
                  {w.images[0] ? (
                    <img src={w.images[0]} alt={w.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🖼️</div>
                  )}
                  {/* 공개 여부 배지 */}
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: w.isPublic ? "rgba(99,102,241,0.8)" : "rgba(0,0,0,0.6)",
                    color: "white",
                  }}>
                    {w.isPublic ? "공개" : "비공개"}
                  </div>
                </div>

                {/* 정보 */}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                  <div style={{ color: "#9999bb", fontSize: 12, marginBottom: 12 }}>{w.category} · 조회 {w.viewCount}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDelete(w.id)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: 8, fontSize: 12,
                        background: "rgba(239,68,68,0.1)", color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
                      }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
