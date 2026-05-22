"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getWorksByAuthor, getOffersForStudent } from "@/lib/firestore";
import type { Work, Offer } from "@/types";

export default function StudentDashboard() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (!loading && userDoc?.role !== "student") { router.push("/"); return; }
    if (firebaseUser) {
      Promise.all([
        getWorksByAuthor(firebaseUser.uid),
        getOffersForStudent(firebaseUser.uid),
      ]).then(([w, o]) => { setWorks(w); setOffers(o); });
    }
  }, [firebaseUser, userDoc, loading, router]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>
  );

  const pendingOffers = offers.filter((o) => o.status === "pending");

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* 상단 바 */}
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 12 }}>G</span>
          </div>
          <span style={{ fontWeight: 800, color: "#f0f0ff", fontSize: 15 }}>GoodPortfolio</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#9999bb", fontSize: 13 }}>{userDoc?.displayName}님</span>
          <Link href={`/portfolio/${firebaseUser?.uid}`} style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#9999bb", padding: "6px 14px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            내 포트폴리오 →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {/* 인사말 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            안녕하세요, <span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userDoc?.displayName}</span>님 👋
          </h1>
          <p style={{ color: "#55556e", fontSize: 14 }}>오늘도 멋진 작품을 업로드해 보세요!</p>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }} className="stats-grid">
          {[
            { label: "등록 작품", value: works.length, color: "#6366f1", icon: "🎨" },
            { label: "총 조회수", value: works.reduce((a, w) => a + (w.viewCount || 0), 0), color: "#22d3ee", icon: "👁" },
            { label: "받은 제안", value: offers.length, color: "#a855f7", icon: "📨" },
            { label: "미응답", value: pendingOffers.length, color: "#f59e0b", icon: "⏳" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <span style={{ color: "#55556e", fontSize: 11 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }} className="quick-menu">
          {[
            { href: "/dashboard/student/works/new", icon: "➕", label: "작품 업로드", desc: "새 작품 등록" },
            { href: "/dashboard/student/profile", icon: "👤", label: "프로필 편집", desc: "소개, 기술 태그" },
            { href: "/dashboard/student/offers", icon: "📨", label: "채용 제안", desc: `${pendingOffers.length}건 미응답` },
          ].map((m) => (
            <Link key={m.href} href={m.href} style={{
              background: "#111118", border: "1px solid #2e2e3f", borderRadius: 14,
              padding: "18px 16px", textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
              transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2e2e3f"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1a1a24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#f0f0ff", fontSize: 14 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "#55556e" }}>{m.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#2e2e3f" }}>→</span>
            </Link>
          ))}
        </div>

        {/* 작품 목록 — 그리드 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, color: "#f0f0ff" }}>내 작품 ({works.length})</h2>
            <Link href="/dashboard/student/works" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none" }}>전체 관리 →</Link>
          </div>

          {works.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
              <p style={{ color: "#9999bb", marginBottom: 16, fontSize: 14 }}>아직 등록된 작품이 없습니다.</p>
              <Link href="/dashboard/student/works/new" style={{ background: "#6366f1", color: "white", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 13 }}>
                첫 작품 업로드하기
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {works.map((w) => (
                <div key={w.id} style={{ borderRadius: 10, overflow: "hidden", background: "#1a1a24", position: "relative", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                  <div style={{ aspectRatio: "1" }}>
                    {w.images?.[0] ? (
                      <img src={w.images[0]} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎨</div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f0f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                    <div style={{ fontSize: 10, color: "#55556e", marginTop: 2 }}>{w.category}</div>
                  </div>
                  {!w.isPublic && (
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", color: "#9999bb", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>비공개</div>
                  )}
                </div>
              ))}
              {/* 업로드 버튼 */}
              <Link href="/dashboard/student/works/new" style={{
                borderRadius: 10, border: "2px dashed #2e2e3f", display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", gap: 6, textDecoration: "none",
                color: "#55556e", aspectRatio: "1", fontSize: 24,
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLElement).style.color = "#818cf8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2e2e3f"; (e.currentTarget as HTMLElement).style.color = "#55556e"; }}>
                ＋
                <span style={{ fontSize: 11 }}>추가</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .quick-menu { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
