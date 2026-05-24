"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Script from "next/script";

const DEFAULT_STATS = [
  { value: "120+", label: "등록 학생" },
  { value: "850+", label: "등록 작품" },
  { value: "30+",  label: "협력 기업" },
  { value: "95%",  label: "취업 연계율" },
];
const CATEGORIES = ["ALL", "웹툰", "게임아트", "캐릭터", "배경", "UI/UX", "3D"];

interface Work { id: string; title: string; category: string; images: string[]; authorUid: string; tools: string[]; viewCount: number; }
interface Notice { id: string; title: string; content: string; }

export default function HomePage() {
  const { firebaseUser, userDoc } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [ctaText, setCtaText] = useState("학교 이메일로 가입하고 무료로 시작하세요");
  const [heroTitle, setHeroTitle] = useState("당신의");
  const [heroSubtitle, setHeroSubtitle] = useState("작품을");
  const [heroTagline, setHeroTagline] = useState("세상에.");
  const [heroDescription, setHeroDescription] = useState("웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고 산업체 인사 담당자와 직접 연결되는 플랫폼");
  const [heroType, setHeroType] = useState<"grid" | "slide" | "square">("grid");
  const [borderRadius, setBorderRadius] = useState<"rounded" | "square">("rounded");
  const [borderColor, setBorderColor] = useState("#2e2e3f");
  const [maxWidth, setMaxWidth] = useState("1280");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimer = useRef<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const wq = query(collection(db, "works"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(12));
        const [wSnap, hSnap, sSnap, nSnap] = await Promise.all([
          getDocs(wq),
          getDocs(collection(db, "heroImages")),
          getDoc(doc(db, "settings", "main")),
          getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3))),
        ]);
        setWorks(wSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Work)));
        setHeroImages(hSnap.docs.map((d) => d.data().url as string));
        setNotices(nSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
        if (sSnap.exists()) {
          const d = sSnap.data();
          if (d.stats) setStats([
            { value: d.stats.students, label: "등록 학생" },
            { value: d.stats.works, label: "등록 작품" },
            { value: d.stats.companies, label: "협력 기업" },
            { value: d.stats.employment, label: "취업 연계율" },
          ]);
          if (d.ctaText) setCtaText(d.ctaText);
          if (d.heroTitle) setHeroTitle(d.heroTitle);
          if (d.heroSubtitle) setHeroSubtitle(d.heroSubtitle);
          if (d.heroTagline) setHeroTagline(d.heroTagline);
          if (d.heroDescription) setHeroDescription(d.heroDescription);
          if (d.heroType) setHeroType(d.heroType);
          if (d.borderRadius) setBorderRadius(d.borderRadius);
          if (d.borderColor) setBorderColor(d.borderColor);
          if (d.maxWidth) setMaxWidth(d.maxWidth);
        }
      } catch (e) { console.error(e); }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (heroType === "slide" && gridImages.length > 1) {
      slideTimer.current = setInterval(() => setSlideIndex((prev) => (prev + 1) % gridImages.length), 3000);
      return () => clearInterval(slideTimer.current);
    }
  }, [heroType, heroImages]);

  const gridImages = heroImages.length > 0 ? heroImages : works.map((w) => w.images?.[0]).filter(Boolean) as string[];
  const filtered = selectedCategory === "ALL" ? works : works.filter((w) => w.category === selectedCategory);
  const br = borderRadius === "rounded" ? 14 : 0;
  const bc = borderColor === "transparent" ? "transparent" : borderColor;
  const mw = maxWidth === "100%" ? "100%" : `${maxWidth}px`;

  const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: br, overflow: "hidden", background: "#1a1a24", border: `1px solid ${bc}`, ...extra
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GoodPortfolio",
    "url": "https://goodportfolio-five.vercel.app",
    "description": "구미대학교 웹툰·게임콘텐츠 학생 포트폴리오 플랫폼",
  };

  // 학생 로그인 여부
  const isStudent = firebaseUser && userDoc?.role === "student";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#f0f0ff" }}>
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* ── 히어로 ── */}
      <section style={{ minHeight: "100vh", paddingTop: 80, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)" }}>
        <div style={{ position: "absolute", top: "30%", left: "40%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: mw, margin: "0 auto", padding: "60px 24px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 32, height: 1, background: "#6366f1" }} />
            <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>구미대학교 공식 포트폴리오 플랫폼</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 60, alignItems: "start" }} className="hero-grid">
            <div>
              <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 24 }}>
                <span style={{ display: "block", color: "#f0f0ff" }}>{heroTitle}</span>
                <span style={{ display: "block", background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{heroSubtitle}</span>
                <span style={{ display: "block", color: "#f0f0ff" }}>{heroTagline}</span>
              </h1>
              <p style={{ color: "#9999bb", fontSize: 17, lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>{heroDescription}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56 }}>
                <Link href="/gallery" style={{ background: "#6366f1", color: "white", padding: "12px 32px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>
                  포트폴리오 보기 →
                </Link>
                {/* 3번: 학생 로그인 시 작품등록 버튼, 비로그인 시 회원가입 버튼 */}
                {isStudent ? (
                  <Link href="/dashboard/student/works/new" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "12px 32px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>
                    🎨 작품 등록
                  </Link>
                ) : !firebaseUser ? (
                  <Link href="/register" style={{ border: "1px solid #3d3d52", color: "#9999bb", padding: "12px 32px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>
                    회원가입
                  </Link>
                ) : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, borderTop: "1px solid #2e2e3f", paddingTop: 32 }}>
                {stats.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</div>
                    <div style={{ color: "#55556e", fontSize: 13, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 히어로 이미지 */}
            <Link href="/gallery" style={{ textDecoration: "none", display: "block" }}>
              {heroType === "grid" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 160px)", gap: 10 }}>
                  <div style={{ ...cardStyle(), gridColumn: "1 / span 2", gridRow: "1 / span 2" }}>
                    {gridImages[0] ? <img src={gridImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: 48 }}>🎨</div>}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ ...cardStyle(), gridColumn: i === 4 ? "2 / span 2" : undefined }}>
                      {gridImages[i] ? <img src={gridImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.15, fontSize: 24 }}>🎨</div>}
                    </div>
                  ))}
                </div>
              )}
              {heroType === "square" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} style={{ ...cardStyle(), aspectRatio: "1" }}>
                      {gridImages[i] ? <img src={gridImages[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.15, fontSize: 24 }}>🎨</div>}
                    </div>
                  ))}
                </div>
              )}
              {heroType === "slide" && (
                <div style={{ position: "relative", ...cardStyle({ height: 480 }) }}>
                  {gridImages.length > 0
                    ? <img src={gridImages[slideIndex]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.5s" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2, fontSize: 64 }}>🎨</div>}
                  {gridImages.length > 1 && (
                    <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }} onClick={(e) => e.preventDefault()}>
                      {gridImages.map((_, i) => (
                        <button key={i} onClick={(e) => { e.preventDefault(); setSlideIndex(i); }} style={{ width: i === slideIndex ? 20 : 6, height: 6, borderRadius: 999, background: i === slideIndex ? "#6366f1" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* 공지사항 */}
      {notices.length > 0 && (
        <section style={{ background: "#111118", borderTop: "1px solid #1a1a24", borderBottom: "1px solid #1a1a24" }}>
          <div style={{ maxWidth: mw, margin: "0 auto", padding: "24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 24, height: 1, background: "#6366f1" }} />
              <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>공지사항</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notices.map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#6366f1", fontSize: 12, marginTop: 2, flexShrink: 0 }}>▪</span>
                  <div>
                    <span style={{ color: "#9999bb", fontSize: 13, fontWeight: 600 }}>{n.title}</span>
                    {n.content && <p style={{ color: "#55556e", fontSize: 12, marginTop: 2 }}>{n.content.length > 80 ? n.content.slice(0, 80) + "..." : n.content}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 갤러리 */}
      <section style={{ maxWidth: mw, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 32, height: 1, background: "#6366f1" }} />
              <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>Latest Works</span>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2 }}>
              주목할 만한<br /><span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>포트폴리오</span>
            </h2>
          </div>
          <Link href="/gallery" style={{ color: "#9999bb", textDecoration: "none", fontSize: 14 }}>전체 보기 →</Link>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 40, overflowX: "auto", paddingBottom: 8 }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setSelectedCategory(c)} style={{ flexShrink: 0, padding: "8px 20px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: selectedCategory === c ? "none" : `1px solid ${bc}`, background: selectedCategory === c ? "#6366f1" : "#111118", color: selectedCategory === c ? "white" : "#9999bb", cursor: "pointer" }}>{c}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <p style={{ color: "#9999bb" }}>첫 번째 작품을 등록해 보세요!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {filtered.slice(0, 8).map((w) => (
              <Link key={w.id} href={`/work/${w.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#111118", border: `1px solid ${bc}`, borderRadius: br, overflow: "hidden", cursor: "pointer", transition: "all 0.3s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(99,102,241,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <div style={{ aspectRatio: "1", background: "#1a1a24", overflow: "hidden" }}>
                    {w.images?.[0] ? <img src={w.images[0]} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎨</div>}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>{w.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section style={{ background: "#111118", borderTop: `1px solid ${bc}`, borderBottom: `1px solid ${bc}` }}>
        <div style={{ maxWidth: mw, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: "#6366f1" }} />
            <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>How It Works</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 56 }}>3단계로 <span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>채용까지</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="how-grid">
            {[
              { step: "01", icon: "🎨", title: "포트폴리오 등록", desc: "작품을 업로드하고 나만의 포트폴리오 페이지를 만드세요" },
              { step: "02", icon: "🔍", title: "기업이 발견", desc: "산업체 인사 담당자가 갤러리에서 당신의 작품을 발견합니다" },
              { step: "03", icon: "💼", title: "채용 연결", desc: "채용 제안을 받고 꿈의 기업에 지원하세요" },
            ].map((item) => (
              <div key={item.step} style={{ background: "#1a1a24", border: `1px solid ${bc}`, borderRadius: br, padding: 32, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 16, right: 20, fontSize: 56, fontWeight: 900, color: "#2e2e3f" }}>{item.step}</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{item.title}</div>
                <div style={{ color: "#9999bb", fontSize: 14, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: mw, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ background: "#111118", border: `1px solid ${bc}`, borderRadius: br + 8, padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 32, height: 1, background: "#6366f1" }} />
              <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>Join Us</span>
              <div style={{ width: 32, height: 1, background: "#6366f1" }} />
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
              지금 바로<br /><span style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>포트폴리오를 만들어보세요</span>
            </h2>
            <p style={{ color: "#9999bb", marginBottom: 40, fontSize: 16 }}>{ctaText}</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {!firebaseUser ? (
                <>
                  <Link href="/register" style={{ background: "#6366f1", color: "white", padding: "14px 40px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>학생으로 가입하기</Link>
                  <Link href="/register" style={{ border: "1px solid #3d3d52", color: "#9999bb", padding: "14px 40px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>기업으로 가입하기</Link>
                </>
              ) : (
                <Link href="/gallery" style={{ background: "#6366f1", color: "white", padding: "14px 40px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>갤러리 둘러보기 →</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`
        @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .how-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
