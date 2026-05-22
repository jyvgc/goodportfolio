"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { firebaseUser, userDoc } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  const dashboardPath =
    userDoc?.role === "admin"   ? "/admin" :
    userDoc?.role === "company" ? "/dashboard/company" :
    "/dashboard/student";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "all 0.3s",
      background: scrolled || menuOpen ? "rgba(10,10,15,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #2e2e3f" : "none",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* 로고 */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 14 }}>G</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#f0f0ff" }}>
            Good<span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Portfolio</span>
          </span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="desktop-nav">
          <Link href="/gallery" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>갤러리</Link>
          {firebaseUser ? (
            <>
              <Link href={dashboardPath} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>
                {userDoc?.role === "admin" ? "🔐 관리자" : "대시보드"}
              </Link>
              <button onClick={handleLogout} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, color: "#55556e", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 14, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>로그인</Link>
              <Link href="/register" style={{ background: "#6366f1", color: "white", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>회원가입</Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, color: "#f0f0ff", fontSize: 22 }} className="mobile-menu-btn">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div style={{ background: "#0a0a0f", borderTop: "1px solid #2e2e3f", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }} className="mobile-dropdown">
          <Link href="/gallery" onClick={() => setMenuOpen(false)} style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>갤러리</Link>
          {firebaseUser ? (
            <>
              <Link href={dashboardPath} onClick={() => setMenuOpen(false)} style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>
                {userDoc?.role === "admin" ? "🔐 관리자" : "대시보드"}
              </Link>
              <button onClick={handleLogout} style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontWeight: 500, textAlign: "left" }}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, color: "#9999bb", textDecoration: "none", fontWeight: 500 }}>로그인</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ margin: "8px 16px", background: "#6366f1", color: "white", padding: "12px 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block" }}>회원가입</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-dropdown { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
