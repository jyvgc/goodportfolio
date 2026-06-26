"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import LoginForm from "@/components/auth/LoginForm";

const getDashboardPath = (role: string) => {
  if (role === "admin")     return "/admin";
  if (role === "company")   return "/dashboard/company";
  if (role === "professor") return "/dashboard/professor";
  return "/dashboard/student";
};

export default function LoginPage() {
  const router = useRouter();
  const { handleRedirectResult } = useAuth();


  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex" }}>
      <div style={{ flex:1, display:"none", background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", position:"relative", overflow:"hidden", alignItems:"center", justifyContent:"center", flexDirection:"column", padding:60 }} className="login-visual">
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)" }} />
        <div style={{ position:"relative", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:24 }}>🎨</div>
          <h2 style={{ fontSize:32, fontWeight:900, color:"#f0f0ff", marginBottom:16, lineHeight:1.2 }}>당신의 작품을<br /><span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>세상에 선보이세요</span></h2>
          <p style={{ color:"#9999bb", fontSize:15, lineHeight:1.7 }}>웹툰·게임콘텐츠 학생들의<br />포트폴리오 & 채용 연계 플랫폼</p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:40 }}>
            {["학생 120+","작품 850+","기업 30+"].map((s) => (
              <div key={s} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 20px", color:"#9999bb", fontSize:13 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", minHeight:"100vh" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:40, justifyContent:"center" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"white", fontWeight:900, fontSize:18 }}>G</span>
            </div>
            <span style={{ fontWeight:800, fontSize:22, color:"#f0f0ff" }}>Good<span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Portfolio</span></span>
          </Link>
          <LoginForm />
        </div>
      </div>
      <style>{`@media(min-width:900px){.login-visual{display:flex !important;}}`}</style>
    </div>
  );
}
