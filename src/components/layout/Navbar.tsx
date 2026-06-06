"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const getAvatarColor = (name: string) => {
  const colors = ["linear-gradient(135deg,#6366f1,#22d3ee)","linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#10b981,#22d3ee)","linear-gradient(135deg,#a855f7,#6366f1)","linear-gradient(135deg,#f97316,#f59e0b)"];
  return colors[(name?.charCodeAt(0)||0)%colors.length];
};

export default function Navbar() {
  const { firebaseUser, userDoc } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState("1280");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    getDoc(doc(db,"settings","main")).then((snap) => {
      if (snap.exists() && snap.data().maxWidth) setMaxWidth(snap.data().maxWidth);
    }).catch(()=>{});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setProfileMenuOpen(false);
    router.push("/");
  };

  const dashboardPath =
    userDoc?.role === "admin"     ? "/admin" :
    userDoc?.role === "company"   ? "/dashboard/company" :
    userDoc?.role === "professor" ? "/dashboard/professor" :
    "/dashboard/student";

  const dashboardLabel =
    userDoc?.role === "admin"     ? "🔐 관리자" :
    userDoc?.role === "professor" ? "📚 교수" :
    "대시보드";

  const passwordPath =
    userDoc?.role === "company"   ? "/dashboard/company/password" :
    userDoc?.role === "professor" ? "/dashboard/professor/password" :
    "/dashboard/student/password";

  const mw = maxWidth==="100%" ? "100%" : `${maxWidth}px`;
  const profileImage = firebaseUser?.photoURL || userDoc?.profileImage || "";
  const displayName = userDoc?.displayName || firebaseUser?.displayName || "";

  const menuItem = (href: string, label: string) => (
    <Link href={href} onClick={() => setProfileMenuOpen(false)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:8, fontSize:13, color:"#9999bb", textDecoration:"none" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background="#1a1a24")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background="transparent")}>
      {label}
    </Link>
  );

  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, transition:"all 0.3s",
      background:scrolled||menuOpen?"rgba(10,10,15,0.97)":"transparent",
      backdropFilter:scrolled?"blur(12px)":"none",
      borderBottom:scrolled?"1px solid #2e2e3f":"none" }}>
      <div style={{ maxWidth:mw, margin:"0 auto", padding:"0 20px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ color:"white", fontWeight:900, fontSize:14 }}>G</span>
          </div>


<span style={{ fontWeight: 800, fontSize: 18, color: "#f0f0ff" }}> GMU{' '}
  <span style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
    Game Webtoon
  </span>
  {' '}Portfolio
</span>

        </Link>

        <div style={{ display:"flex", alignItems:"center", gap:4 }} className="desktop-nav">
          <Link href="/gallery" style={{ padding:"8px 16px", borderRadius:8, fontSize:14, color:"#9999bb", textDecoration:"none", fontWeight:500 }}>갤러리</Link>

          {firebaseUser ? (
            <>
              <Link href={dashboardPath} style={{ padding:"8px 16px", borderRadius:8, fontSize:14, color:"#9999bb", textDecoration:"none", fontWeight:500 }}>{dashboardLabel}</Link>
              <div ref={dropdownRef} style={{ position:"relative" }}>
                <button type="button" onClick={() => setProfileMenuOpen((p) => !p)}
                  style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:10 }}>
                  <div style={{ width:34, height:34, borderRadius:10, overflow:"hidden", flexShrink:0, border:`2px solid ${profileMenuOpen?"#6366f1":"#2e2e3f"}`, transition:"border-color 0.2s" }}>
                    {profileImage
                      ? <img src={profileImage} alt={displayName} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ width:"100%", height:"100%", background:getAvatarColor(displayName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"white" }}>{displayName?.charAt(0)||"?"}</div>}
                  </div>
                  <span style={{ fontSize:12, color:"#55556e", transform:profileMenuOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>▾</span>
                </button>

                {profileMenuOpen && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, padding:8, minWidth:200, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:100 }}>
                    <div style={{ padding:"10px 12px", borderBottom:"1px solid #1a1a24", marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f0f0ff" }}>{displayName}</div>
                      <div style={{ fontSize:11, color:"#55556e", marginTop:2 }}>{userDoc?.email}</div>
                      {userDoc?.role === "professor" && (
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"rgba(168,85,247,0.15)", color:"#a855f7", marginTop:4, display:"inline-block" }}>👨‍🏫 교수</span>
                      )}
                    </div>

                    {/* 학생 메뉴 */}
                    {userDoc?.role === "student" && (<>
                      {menuItem("/dashboard/student/profile", "👤 프로필 편집")}
                      {menuItem(`/portfolio/${firebaseUser.uid}`, "🎨 내 포트폴리오")}
                      {menuItem("/dashboard/student/password", "🔒 비밀번호 변경")}
                    </>)}

                    {/* 기업 메뉴 */}
                    {userDoc?.role === "company" && (<>
                      {menuItem("/dashboard/company/profile", "🏢 회사 정보 수정")}
                      {menuItem("/dashboard/company/password", "🔒 비밀번호 변경")}
                    </>)}

                    {/* 교수 메뉴 */}
                    {userDoc?.role === "professor" && (<>
                      {menuItem("/dashboard/professor/students",  "👨‍🎨 학생 관리")}
                      {menuItem("/dashboard/professor/companies", "🏢 기업 관리")}
                      {menuItem("/dashboard/professor/works",     "🎨 작품 관리")}
                      {menuItem("/dashboard/professor/password",  "🔒 비밀번호 변경")}
                    </>)}

                    <div style={{ borderTop:"1px solid #1a1a24", marginTop:4, paddingTop:4 }}>
                      <button onClick={handleLogout}
                        style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13, color:"#f87171", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.1)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background="transparent")}>
                        🚪 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login"    style={{ padding:"8px 16px", borderRadius:8, fontSize:14, color:"#9999bb", textDecoration:"none", fontWeight:500 }}>로그인</Link>
              <Link href="/register" style={{ background:"#6366f1", color:"white", padding:"8px 20px", borderRadius:8, fontSize:14, fontWeight:600, textDecoration:"none" }}>회원가입</Link>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display:"none", background:"none", border:"none", cursor:"pointer", padding:8, color:"#f0f0ff", fontSize:22 }} className="mobile-menu-btn">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 모바일 */}
      {menuOpen && (
        <div style={{ background:"#0a0a0f", borderTop:"1px solid #2e2e3f", padding:"16px 20px", display:"flex", flexDirection:"column", gap:4 }} className="mobile-dropdown">
          {firebaseUser && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #1a1a24", marginBottom:8 }}>
              <div style={{ width:40, height:40, borderRadius:10, overflow:"hidden", flexShrink:0 }}>
                {profileImage
                  ? <img src={profileImage} alt={displayName} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", background:getAvatarColor(displayName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"white" }}>{displayName?.charAt(0)||"?"}</div>}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#f0f0ff" }}>{displayName}</div>
                <div style={{ fontSize:11, color:"#55556e" }}>
                  {userDoc?.role==="student"?"학생":userDoc?.role==="company"?"기업":userDoc?.role==="professor"?"교수":"관리자"}
                </div>
              </div>
            </div>
          )}
          <Link href="/gallery" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>갤러리</Link>
          {firebaseUser ? (
            <>
              <Link href={dashboardPath} onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>{dashboardLabel}</Link>
              {userDoc?.role === "student" && (<>
                <Link href="/dashboard/student/profile" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>프로필 편집</Link>
                <Link href={`/portfolio/${firebaseUser.uid}`} onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>내 포트폴리오</Link>
                <Link href="/dashboard/student/password" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>비밀번호 변경</Link>
              </>)}
              {userDoc?.role === "company" && (<>
                <Link href="/dashboard/company/profile" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>회사 정보 수정</Link>
                <Link href="/dashboard/company/password" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>비밀번호 변경</Link>
              </>)}
              {userDoc?.role === "professor" && (<>
                <Link href="/dashboard/professor/students"  onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>학생 관리</Link>
                <Link href="/dashboard/professor/companies" onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>기업 관리</Link>
                <Link href="/dashboard/professor/works"     onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>작품 관리</Link>
                <Link href="/dashboard/professor/password"  onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>비밀번호 변경</Link>
              </>)}
              <button onClick={handleLogout} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#f87171", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login"    onClick={() => setMenuOpen(false)} style={{ padding:"12px 16px", borderRadius:8, fontSize:15, color:"#9999bb", textDecoration:"none" }}>로그인</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} style={{ margin:"8px 16px", background:"#6366f1", color:"white", padding:"12px 20px", borderRadius:8, fontSize:15, fontWeight:600, textDecoration:"none", textAlign:"center", display:"block" }}>회원가입</Link>
            </>
          )}
        </div>
      )}
      <style>{`@media(max-width:768px){.desktop-nav{display:none !important;}.mobile-menu-btn{display:block !important;}}@media(min-width:769px){.mobile-dropdown{display:none !important;}}`}</style>
    </nav>
  );
}
