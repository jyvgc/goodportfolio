"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  website: string;
  kakao: string;
}

export default function Footer() {
  const [maxWidth, setMaxWidth] = useState("1280");
  const [contact, setContact] = useState<ContactInfo>({
    email: "admin@gumi.ac.kr",
    phone: "",
    address: "경북 구미시",
    website: "",
    kakao: "",
  });

  useEffect(() => {
    getDoc(doc(db, "settings", "main")).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.maxWidth) setMaxWidth(d.maxWidth);
      if (d.contact) setContact({ ...contact, ...d.contact });
    }).catch(() => {});
  }, []);

  const mw = maxWidth === "100%" ? "100%" : `${maxWidth}px`;

  const contactItems = [
    contact.email    && { icon: "📧", label: contact.email, href: `mailto:${contact.email}` },
    contact.phone    && { icon: "📞", label: contact.phone, href: `tel:${contact.phone}` },
    contact.address  && { icon: "📍", label: contact.address, href: null },
    contact.website  && { icon: "🌐", label: "학과 홈페이지", href: contact.website },
    contact.kakao    && { icon: "💬", label: "카카오톡 문의", href: contact.kakao },
  ].filter(Boolean) as { icon: string; label: string; href: string | null }[];

  return (
    <footer style={{ background: "#080810", borderTop: "1px solid #1a1a24", marginTop: 80 }}>
      <div style={{ maxWidth: mw, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">

          {/* 브랜드 */}
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

          {/* 플랫폼 */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>플랫폼</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ href: "/gallery", label: "갤러리" }, { href: "/register", label: "학생 가입" }, { href: "/register", label: "기업 가입" }, { href: "/login", label: "로그인" }].map((l) => (
                <Link key={l.label} href={l.href} style={{ color: "#55556e", textDecoration: "none", fontSize: 13 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#818cf8"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#55556e"}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 학과 */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>학과</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["웹툰스쿨", "비주얼게임컨텐츠스쿨", "구미대학교"].map((t) => (
                <span key={t} style={{ color: "#55556e", fontSize: 13 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* 문의 — Firebase에서 불러온 정보 */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>문의</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contactItems.length > 0 ? contactItems.map((item, i) => (
                item.href ? (
                  <a key={i} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                    style={{ color: "#55556e", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#818cf8"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#55556e"}>
                    <span>{item.icon}</span> {item.label}
                  </a>
                ) : (
                  <span key={i} style={{ color: "#55556e", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{item.icon}</span> {item.label}
                  </span>
                )
              )) : (
                <span style={{ color: "#2e2e3f", fontSize: 12 }}>관리자 설정에서 편집하세요</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1a1a24", padding: "20px 24px" }}>
        <div style={{ maxWidth: mw, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "#2e2e3f", fontSize: 12 }}>© 2026 GoodPortfolio. Powered by Next.js + Firebase + Vercel.</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["개인정보처리방침", "이용약관"].map((t) => (
              <span key={t} style={{ color: "#2e2e3f", fontSize: 12, cursor: "pointer" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; } }
        @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
