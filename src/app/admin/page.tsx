"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [stats, setStats] = useState({ students: 0, companies: 0, works: 0, offers: 0, pendingCompanies: 0, pendingOffers: 0 });

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (!loading && userDoc?.role !== "admin") { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchStats();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchStats = async () => {
    try {
      const [s, c, w, o, pc] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(query(collection(db, "users"), where("role", "==", "company"))),
        getDocs(collection(db, "works")),
        getDocs(collection(db, "offers")),
        getDocs(query(collection(db, "users"), where("role", "==", "company"), where("isApproved", "==", false))),
      ]);
      const pendingOffers = o.docs.filter(d => !d.data().adminApproved && d.data().status !== "admin_rejected").length;
      setStats({ students: s.size, companies: c.size, works: w.size, offers: o.size, pendingCompanies: pc.size, pendingOffers });
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  const MENU = [
    { href: "/admin/students", icon: "👨‍🎨", label: "학생 관리", desc: `총 ${stats.students}명`, color: "#6366f1" },
    { href: "/admin/companies", icon: "🏢", label: "기업 승인", desc: `승인 대기 ${stats.pendingCompanies}건`, color: "#f59e0b" },
    { href: "/admin/offers", icon: "💼", label: "채용 제안 관리", desc: `승인 대기 ${stats.pendingOffers}건`, color: "#10b981" },
    { href: "/admin/works", icon: "🎨", label: "작품 관리", desc: `총 ${stats.works}개`, color: "#22d3ee" },
    { href: "/admin/notices", icon: "📢", label: "공지사항", desc: "공지 등록/관리", color: "#a855f7" },
    { href: "/admin/settings", icon: "⚙️", label: "사이트 설정", desc: "통계·카테고리·히어로 이미지", color: "#f87171" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 900, fontSize: 12 }}>G</span>
            </div>
            <span style={{ fontWeight: 800, color: "#f0f0ff" }}>GoodPortfolio</span>
          </Link>
          <span style={{ padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>🔐 관리자</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>관리자 대시보드</h1>
        <p style={{ color: "#9999bb", marginBottom: 40 }}>플랫폼 전체 현황을 관리하세요</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }} className="admin-stats">
          {[
            { label: "등록 학생", value: stats.students, icon: "👨‍🎨", color: "#6366f1" },
            { label: "등록 기업", value: stats.companies, icon: "🏢", color: "#22d3ee" },
            { label: "전체 작품", value: stats.works, icon: "🎨", color: "#10b981" },
            { label: "채용 제안", value: stats.offers, icon: "💼", color: "#f59e0b" },
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

        {/* 알림 */}
        {(stats.pendingCompanies > 0 || stats.pendingOffers > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {stats.pendingCompanies > 0 && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 14 }}>⚠️ 기업 계정 승인 대기 {stats.pendingCompanies}건</span>
                <Link href="/admin/companies" style={{ background: "#f59e0b", color: "white", padding: "6px 14px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>처리하기 →</Link>
              </div>
            )}
            {stats.pendingOffers > 0 && (
              <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <span style={{ color: "#818cf8", fontWeight: 600, fontSize: 14 }}>💼 채용 제안 승인 대기 {stats.pendingOffers}건</span>
                <Link href="/admin/offers" style={{ background: "#6366f1", color: "white", padding: "6px 14px", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>처리하기 →</Link>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="admin-menu">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24, textDecoration: "none", display: "flex", alignItems: "center", gap: 16, transition: "all 0.3s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}50`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2e2e3f"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#f0f0ff", fontSize: 15, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "#55556e" }}>{m.desc}</div>
              </div>
              <span style={{ color: "#55556e" }}>→</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-menu { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .admin-menu { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
