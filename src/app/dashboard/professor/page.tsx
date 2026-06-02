"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProfessorDashboard() {
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (!loading && userDoc?.role !== "professor") { router.push("/"); return; }
  }, [firebaseUser, userDoc, loading]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", color:"#818cf8" }}>
      로딩 중...
    </div>
  );

  const MENU = [
    { href:"/dashboard/professor/students", icon:"👨‍🎨", label:"학생 관리",  desc:"학생 목록/활성화/작품 관리", color:"#6366f1" },
    { href:"/dashboard/professor/companies",icon:"🏢",  label:"기업 관리",  desc:"기업 목록/승인 관리",        color:"#22d3ee" },
    { href:"/dashboard/professor/works",    icon:"🎨",  label:"작품 관리",  desc:"작품 공개/비공개/삭제",      color:"#10b981" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:12 }}>
          <h1 style={{ fontSize:24, fontWeight:800 }}>교수 대시보드</h1>
          <span style={{ padding:"4px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:"rgba(168,85,247,0.15)", color:"#a855f7", border:"1px solid rgba(168,85,247,0.3)" }}>
            👨‍🏫 교수 모드
          </span>
        </div>
        <p style={{ color:"#9999bb", marginBottom:48 }}>
          {userDoc?.displayName ?? ""} 교수님, 환영합니다!
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }} className="prof-menu">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href}
              style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:28, textDecoration:"none", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:12, transition:"all 0.3s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor=`${m.color}50`; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#2e2e3f"; (e.currentTarget as HTMLElement).style.transform="translateY(0)"; }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${m.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontWeight:700, color:"#f0f0ff", fontSize:16, marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:13, color:"#55556e" }}>{m.desc}</div>
              </div>
              <div style={{ color:m.color, fontSize:13, fontWeight:600 }}>바로가기 →</div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
      <style>{`@media(max-width:768px){.prof-menu{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

