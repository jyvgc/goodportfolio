"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES = ["전체", "웹툰", "게임아트", "캐릭터", "배경", "UI/UX", "3D"];
const DEPARTMENTS = ["전체", "웹툰", "게임콘텐츠"];

interface Work {
  id: string;
  title: string;
  category: string;
  images: string[];
  authorUid: string;
  tools: string[];
  viewCount: number;
  createdAt: any;
}

export default function GalleryPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "works"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
      setWorks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = works.filter((w) => {
    const matchCategory = selectedCategory === "전체" || w.category === selectedCategory;
    const matchSearch = searchQuery === "" ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tools?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />

      {/* 헤더 */}
      <div style={{
        paddingTop: 80, paddingBottom: 40,
        borderBottom: "1px solid #2e2e3f",
        background: "#111118",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 32, height: 1, background: "#6366f1" }} />
            <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Portfolio Gallery
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>갤러리</span>
          </h1>

          {/* 검색창 */}
          <div style={{ position: "relative", maxWidth: 480 }}>
            <span style={{
              position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)", color: "#55556e", fontSize: 16,
            }}>🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="작품명, 기술 스택으로 검색..."
              style={{
                width: "100%", background: "#1a1a24",
                border: "1px solid #2e2e3f", color: "#f0f0ff",
                padding: "12px 14px 12px 42px", borderRadius: 10,
                fontSize: 14, outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", gap: 32 }}>

          {/* 사이드바 필터 */}
          <aside style={{ width: 200, flexShrink: 0, display: "none" }} className="md-sidebar">
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: "#55556e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                카테고리
              </h3>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setSelectedCategory(c)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", borderRadius: 8, fontSize: 13,
                  background: selectedCategory === c ? "rgba(99,102,241,0.15)" : "transparent",
                  color: selectedCategory === c ? "#818cf8" : "#9999bb",
                  border: "none", cursor: "pointer", marginBottom: 2,
                }}>{c}</button>
              ))}
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <div style={{ flex: 1 }}>
            {/* 카테고리 탭 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setSelectedCategory(c)} style={{
                  flexShrink: 0, padding: "8px 20px", borderRadius: 999,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: selectedCategory === c ? "none" : "1px solid #2e2e3f",
                  background: selectedCategory === c ? "#6366f1" : "#111118",
                  color: selectedCategory === c ? "white" : "#9999bb",
                }}>{c}</button>
              ))}
            </div>

            {/* 결과 수 */}
            <div style={{ color: "#55556e", fontSize: 13, marginBottom: 20 }}>
              {loading ? "불러오는 중..." : `작품 ${filtered.length}개`}
            </div>

            {/* 갤러리 그리드 */}
            {loading ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: "1", borderRadius: 16,
                    background: "#111118", animation: "pulse 2s infinite",
                  }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
                <p style={{ color: "#9999bb", marginBottom: 8 }}>
                  {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다.` : "아직 등록된 작품이 없습니다."}
                </p>
                <p style={{ color: "#55556e", fontSize: 13 }}>첫 번째 작품을 등록해 보세요!</p>
                <Link href="/register" style={{
                  display: "inline-block", marginTop: 20,
                  background: "#6366f1", color: "white",
                  padding: "12px 32px", borderRadius: 8,
                  textDecoration: "none", fontWeight: 600,
                }}>학생으로 가입하기</Link>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}>
                {filtered.map((w, i) => (
                  <Link key={w.id} href={`/portfolio/${w.authorUid}`}
                    style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "#111118", border: "1px solid #2e2e3f",
                      borderRadius: 16, overflow: "hidden", cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(99,102,241,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#2e2e3f";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      {/* 썸네일 */}
                      <div style={{ aspectRatio: "1", background: "#1a1a24", overflow: "hidden", position: "relative" }}>
                        {w.images?.[0] ? (
                          <img src={w.images[0]} alt={w.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{
                            width: "100%", height: "100%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 40,
                          }}>🎨</div>
                        )}
                        {/* 카테고리 배지 */}
                        <div style={{
                          position: "absolute", top: 10, left: 10,
                          padding: "3px 10px", borderRadius: 999,
                          fontSize: 11, fontWeight: 600,
                          background: "rgba(99,102,241,0.8)",
                          color: "white",
                        }}>{w.category}</div>
                      </div>

                      {/* 정보 */}
                      <div style={{ padding: 14 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 14, marginBottom: 6,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          color: "#f0f0ff",
                        }}>{w.title}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {w.tools?.slice(0, 3).map((t) => (
                            <span key={t} style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 999,
                              background: "#1a1a24", color: "#9999bb",
                              border: "1px solid #2e2e3f",
                            }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ color: "#55556e", fontSize: 11, marginTop: 8 }}>
                          👁 {w.viewCount || 0}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
