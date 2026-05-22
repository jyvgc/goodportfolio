"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Notice { id: string; title: string; content: string; createdAt: any; }

export default function Footer() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const snap = await getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3)));
        setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
      } catch {
        const snap = await getDocs(collection(db, "notices"));
        setNotices(snap.docs.slice(0, 3).map((d) => ({ id: d.id, ...d.data() } as Notice)));
      }
    };
    fetchNotices();
  }, []);

  return (
    <footer style={{ background: "#080810", borderTop: "1px solid #1a1a24", marginTop: 80 }}>

      {/* 공지사항 섹션 */}
      {notices.length > 0 && (
        <div style={{ borderBottom: "1px solid #1a1a24" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 24, height: 1, background: "#6366f1" }} />
              <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>공지사항</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notices.map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ color: "#6366f1", fontSize: 12, marginTop: 2, flexShrink: 0 }}>▪</span>
                  <div>
                    <span style={{ color: "#9999bb", fontSize: 13, fontWeight: 600 }}>{n.title}</span>
                    {n.content && <p style={{ color: "#55556e", fontSize: 12, marginTop: 2 }}>{n.content.length > 60 ? n.content.slice(0, 60) + "..." : n.content}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 메인 푸터 */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #22d3ee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>G</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#f0f0ff" }}>
                Good<span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Portfolio</span>
              </span>
            </Link>
            <p style={{ color: "#55556e", fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>
              웹툰·게임콘텐츠 학생들의 작품을 세상에 선보이고 꿈의 기업과 연결되는 포트폴리오 플랫폼
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>플랫폼</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ href: "/gallery", label: "갤러리" }, { href: "/register", label: "학생 가입" }, { href: "/register", label: "기업 가입" }, { href: "/login", label: "로그인" }].map((l) => (
                <Link key={l.label} href={l.href} style={{ color: "#55556e", textDecoration: "none", fontSize: 13 }}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>학과</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["웹툰스쿨", "비주얼게임컨텐츠스쿨", "구미대학교"].map((t) => (
                <span key={t} style={{ color: "#55556e", fontSize: 13 }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>문의</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ color: "#55556e", fontSize: 13 }}>📧 admin@gumi.ac.kr</span>
              <span style={{ color: "#55556e", fontSize: 13 }}>📍 경북 구미시</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1a1a24", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "#2e2e3f", fontSize: 12 }}>© 2026 GoodPortfolio. Powered by Next.js + Firebase + Vercel.</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["개인정보처리방침", "이용약관"].map((t) => (
              <span key={t} style={{ color: "#2e2e3f", fontSize: 12, cursor: "pointer" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
