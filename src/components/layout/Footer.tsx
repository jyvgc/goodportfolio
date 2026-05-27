"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background:"#0a0a0f", borderTop:"1px solid #1a1a24", padding:"48px 24px 32px" }}>
      <div style={{ maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:48, marginBottom:40 }} className="footer-grid">
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:"#f0f0ff", marginBottom:12 }}>Good<span style={{ color:"#6366f1" }}>Portfolio</span></div>
            <p style={{ color:"#55556e", fontSize:14, lineHeight:1.7, maxWidth:320 }}>구미대학교 웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고 산업체와 직접 연결하는 공식 플랫폼입니다.</p>
          </div>
          <div>
            <div style={{ color:"#818cf8", fontSize:11, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:16 }}>학과 홈페이지</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <a href="https://toon.gumi.ac.kr" target="_blank" rel="noopener noreferrer"
                style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color="#6366f1")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color="#9999bb")}>
                🎨 웹툰스쿨
              </a>
              <a href="https://game.gumi.ac.kr" target="_blank" rel="noopener noreferrer"
                style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color="#6366f1")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color="#9999bb")}>
                🎮 비주얼게임컨텐츠스쿨
              </a>
            </div>
          </div>
          <div>
            <div style={{ color:"#818cf8", fontSize:11, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:16 }}>서비스</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[{href:"/gallery",label:"갤러리"},{href:"/register",label:"학생 가입"},{href:"/register",label:"기업 가입"},{href:"/login",label:"로그인"}].map((item) => (
                <Link key={item.label} href={item.href} style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color="#6366f1")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color="#9999bb")}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop:"1px solid #1a1a24", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <p style={{ color:"#55556e", fontSize:12 }}>© 2025 GoodPortfolio · 구미대학교 웹툰스쿨 / 비주얼게임컨텐츠스쿨</p>
          <p style={{ color:"#55556e", fontSize:12 }}>Powered by Next.js · Firebase · Cloudinary</p>
        </div>
      </div>
      <style>{`@media(max-width:768px){.footer-grid{grid-template-columns:1fr !important;gap:32px !important;}}`}</style>
    </footer>
  );
}
