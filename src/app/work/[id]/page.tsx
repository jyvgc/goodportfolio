"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserDoc, incrementWorkView } from "@/lib/firestore";
import type { Work, UserDoc } from "@/types";

const getAvatarColor = (name: string) => {
  const colors = [
    "linear-gradient(135deg, #6366f1, #22d3ee)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #22d3ee)",
    "linear-gradient(135deg, #a855f7, #6366f1)",
    "linear-gradient(135deg, #f97316, #f59e0b)",
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [work, setWork] = useState<Work | null>(null);
  const [author, setAuthor] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [maxWidth, setMaxWidth] = useState("1280");
  const [borderColor, setBorderColor] = useState("transparent");
  const [borderRadius, setBorderRadius] = useState<"rounded" | "square">("rounded");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snap, settings] = await Promise.all([
          getDoc(doc(db, "works", id)),
          getDoc(doc(db, "settings", "main")),
        ]);
        if (!snap.exists()) { setLoading(false); return; }
        const w = { id: snap.id, ...snap.data() } as Work;
        setWork(w);
        const u = await getUserDoc(w.authorUid);
        setAuthor(u);
        await incrementWorkView(id);
        if (settings.exists()) {
          const d = settings.data();
          if (d.maxWidth) setMaxWidth(d.maxWidth);
          if (d.borderColor) setBorderColor(d.borderColor);
          if (d.borderRadius) setBorderRadius(d.borderRadius);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>
  );

  if (!work) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ color: "#f0f0ff" }}>작품을 찾을 수 없습니다</h1>
        <button onClick={() => router.back()} style={{ marginTop: 24, background: "#6366f1", color: "white", padding: "12px 32px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 }}>← 돌아가기</button>
      </div>
    </div>
  );

  const mw = maxWidth === "100%" ? "100%" : `${maxWidth}px`;
  const br = borderRadius === "rounded" ? 14 : 0;

  // 5번: 프로필 이미지 수정 — profileImage 필드 사용
  const profileImage = author?.profileImage || "";
  const displayName = author?.displayName || "학생";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />

      <div style={{ maxWidth: mw, margin: "0 auto", padding: "100px 24px 60px" }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#9999bb", cursor: "pointer", fontSize: 14, marginBottom: 32, padding: 0 }}>
          ← 뒤로가기
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }} className="work-detail-grid">
          {/* 왼쪽 — 이미지 */}
          <div>
            <div onClick={() => setFullscreen(true)} style={{ borderRadius: br, overflow: "hidden", background: "#111118", border: "none", marginBottom: 12, cursor: "zoom-in" }}>
              {work.images?.[selectedImg] ? (
                <img src={work.images[selectedImg]} alt={work.title} style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", maxHeight: "70vh" }} />
              ) : (
                <div style={{ width: "100%", height: 400, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🎨</div>
              )}
            </div>

            {(work.images?.length ?? 0) > 1 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
                {work.images?.map((img, i) => (
                  <div key={i} onClick={() => setSelectedImg(i)} style={{ width: 72, height: 72, borderRadius: br, overflow: "hidden", cursor: "pointer", border: selectedImg === i ? "2px solid #6366f1" : "2px solid transparent", opacity: selectedImg === i ? 1 : 0.6, transition: "all 0.2s" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}

            {(work.images?.length ?? 0) > 1 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 24, height: 1, background: "#6366f1" }} />
                  <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>All Images ({work.images?.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {work.images?.map((img, i) => (
                    <div key={i} onClick={() => { setSelectedImg(i); setFullscreen(true); }} style={{ borderRadius: br, overflow: "hidden", border: "none", cursor: "zoom-in" }}>
                      <img src={img} alt={`${work.title} ${i + 1}`} style={{ width: "100%", height: "auto", display: "block" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 — 정보 */}
          <div style={{ position: "sticky", top: 100 }}>
            <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", marginBottom: 16 }}>
              {Array.isArray(work.category) ? work.category.join(", ") : work.category}
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, lineHeight: 1.3 }}>{work.title}</h1>

            {/* 5번: 프로필 이미지 수정 */}
            {author && (
              <Link href={`/portfolio/${work.authorUid}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 24, padding: "12px 16px", background: "#111118", border: "1px solid #2e2e3f", borderRadius: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "2px solid #2e2e3f" }}>
                  {profileImage ? (
                    <img src={profileImage} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: getAvatarColor(displayName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white" }}>
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#f0f0ff", fontSize: 14 }}>{displayName}</div>
                  <div style={{ color: "#55556e", fontSize: 12 }}>포트폴리오 보기 →</div>
                </div>
              </Link>
            )}

            {work.description && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#55556e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>작품 설명</h3>
                <p style={{ color: "#9999bb", lineHeight: 1.8, fontSize: 14, whiteSpace: "pre-wrap" }}>{work.description}</p>
              </div>
            )}

            {(work.tools?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#55556e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>사용 툴</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {work.tools?.map((t) => <span key={t} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, background: "#1a1a24", color: "#9999bb", border: "1px solid #2e2e3f" }}>{t}</span>)}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 20, padding: "16px 0", borderTop: "1px solid #1a1a24" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>{work.viewCount || 0}</div>
                <div style={{ fontSize: 12, color: "#55556e" }}>조회수</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>{work.images?.length || 1}</div>
                <div style={{ fontSize: 12, color: "#55556e" }}>이미지</div>
              </div>
            </div>
            <p style={{ color: "#55556e", fontSize: 12, marginTop: 4 }}>🔍 이미지를 클릭하면 전체화면으로 볼 수 있어요</p>

            {work.videoUrl && (
              <a href={work.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1a1a24", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", padding: "12px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600, marginTop: 16 }}>
                ▶ 영상 보기
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 전체화면 모달 */}
      {fullscreen && (
        <div onClick={() => setFullscreen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
          {(work.images?.length ?? 0) > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImg((prev) => (prev - 1 + (work.images?.length ?? 1)) % (work.images?.length ?? 1)); }}
                style={{ position: "absolute", left: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", fontSize: 20 }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImg((prev) => (prev + 1) % (work.images?.length ?? 1)); }}
                style={{ position: "absolute", right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", fontSize: 20 }}>›</button>
            </>
          )}
          <img src={work.images?.[selectedImg]} alt={work.title} style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {selectedImg + 1} / {work.images?.length}
          </div>
        </div>
      )}

      <Footer />
      <style>{`
        @media (max-width: 768px) { .work-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
