"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface Work { id: string; title: string; images: string[]; category: string; }

export default function AdminSettingsPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();

  const [stats, setStats] = useState({ students: "120+", works: "850+", companies: "30+", employment: "95%" });
  const [ctaText, setCtaText] = useState("학교 이메일로 가입하고 무료로 시작하세요");
  const [heroTitle, setHeroTitle] = useState("당신의");
  const [heroSubtitle, setHeroSubtitle] = useState("작품을");
  const [heroTagline, setHeroTagline] = useState("세상에.");
  const [heroDescription, setHeroDescription] = useState("웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고 산업체 인사 담당자와 직접 연결되는 플랫폼");
  const [heroType, setHeroType] = useState<"grid" | "slide" | "square">("grid");
  const [borderRadius, setBorderRadius] = useState<"rounded" | "square">("rounded");
  const [borderColor, setBorderColor] = useState("#2e2e3f");
  const [maxWidth, setMaxWidth] = useState("1280");

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");

  // 히어로 이미지 관련
  const [heroImages, setHeroImages] = useState<{ id: string; url: string }[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [showWorkPicker, setShowWorkPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "works">("upload");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchAll();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchAll = async () => {
    try {
      const settingSnap = await getDoc(doc(db, "settings", "main"));
      if (settingSnap.exists()) {
        const d = settingSnap.data();
        if (d.stats) setStats(d.stats);
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

      const catSnap = await getDocs(collection(db, "categories"));
      setCategories(catSnap.docs.map((d) => ({ id: d.id, name: d.data().name })));

      const heroSnap = await getDocs(collection(db, "heroImages"));
      setHeroImages(heroSnap.docs.map((d) => ({ id: d.id, url: d.data().url })));

      // 전체 작품 불러오기
      const worksSnap = await getDocs(query(collection(db, "works"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(50)));
      setAllWorks(worksSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Work)));
    } catch (e) { console.error(e); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "main"), {
        stats, ctaText, heroTitle, heroSubtitle, heroTagline, heroDescription,
        heroType, borderRadius, borderColor, maxWidth, updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success("설정이 저장되었습니다!");
    } catch { toast.error("저장 실패"); }
    setSaving(false);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const ref = await addDoc(collection(db, "categories"), { name: newCategory.trim() });
    setCategories((prev) => [...prev, { id: ref.id, name: newCategory.trim() }]);
    setNewCategory("");
    toast.success("카테고리 추가!");
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const deleteHeroImage = async (id: string) => {
    await deleteDoc(doc(db, "heroImages", id));
    setHeroImages((prev) => prev.filter((h) => h.id !== id));
    toast.success("삭제됨");
  };

  // 직접 업로드
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] }, maxFiles: 6,
    onDrop: async (files) => {
      if (heroImages.length >= 6) { toast.error("최대 6장까지 등록 가능합니다."); return; }
      setUploadingHero(true);
      try {
        for (const f of files) {
          const url = await uploadImage(f, "hero");
          const ref = await addDoc(collection(db, "heroImages"), { url, createdAt: serverTimestamp() });
          setHeroImages((prev) => [...prev, { id: ref.id, url }]);
        }
        toast.success("업로드 완료!");
      } catch { toast.error("업로드 실패"); }
      setUploadingHero(false);
    },
  });

  // 작품에서 히어로 이미지 선택
  const addFromWork = async (imageUrl: string) => {
    if (heroImages.length >= 6) { toast.error("최대 6장까지 등록 가능합니다."); return; }
    if (heroImages.some((h) => h.url === imageUrl)) { toast.error("이미 추가된 이미지입니다."); return; }
    const ref = await addDoc(collection(db, "heroImages"), { url: imageUrl, createdAt: serverTimestamp() });
    setHeroImages((prev) => [...prev, { id: ref.id, url: imageUrl }]);
    toast.success("히어로 이미지에 추가됐습니다!");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  const inputStyle: React.CSSProperties = { width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" };
  const sectionStyle: React.CSSProperties = { background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>사이트 설정</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>사이트 설정</h1>

        {/* 히어로 텍스트 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>✍️ 히어로 텍스트 편집</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              { label: "첫 번째 줄", value: heroTitle, set: setHeroTitle, placeholder: "당신의" },
              { label: "두 번째 줄 (그라디언트)", value: heroSubtitle, set: setHeroSubtitle, placeholder: "작품을" },
              { label: "세 번째 줄", value: heroTagline, set: setHeroTagline, placeholder: "세상에." },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>설명 텍스트</label>
            <textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={3}
              placeholder="히어로 섹션 설명 문구" style={{ ...inputStyle, resize: "none" }} />
          </div>
        </div>

        {/* 히어로 이미지 타입 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🖼️ 히어로 이미지 설정</h2>

          {/* 표시 방식 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 10 }}>표시 방식</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { key: "grid", label: "📐 비대칭 그리드" },
                { key: "square", label: "⬜ 정사각형 그리드" },
                { key: "slide", label: "🎞️ 슬라이드" },
              ].map((t) => (
                <button key={t.key} onClick={() => setHeroType(t.key as any)} style={{
                  flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  border: heroType === t.key ? "2px solid #6366f1" : "1px solid #2e2e3f",
                  background: heroType === t.key ? "rgba(99,102,241,0.1)" : "#0a0a0f",
                  fontWeight: 700, fontSize: 12, color: heroType === t.key ? "#818cf8" : "#9999bb",
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* 현재 히어로 이미지 목록 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "#9999bb" }}>현재 히어로 이미지 ({heroImages.length}/6)</label>
              <span style={{ fontSize: 11, color: "#55556e" }}>드래그로 순서 변경 예정</span>
            </div>
            {heroImages.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 16 }}>
                {heroImages.map((h) => (
                  <div key={h.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: "1px solid #2e2e3f" }}>
                    <img src={h.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => deleteHeroImage(h.id)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.8)", color: "white", border: "none", cursor: "pointer", fontSize: 10 }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#55556e", fontSize: 13, marginBottom: 16 }}>등록된 이미지가 없습니다.</p>
            )}
          </div>

          {/* 이미지 추가 탭 */}
          <div style={{ border: "1px solid #2e2e3f", borderRadius: 12, overflow: "hidden" }}>
            {/* 탭 헤더 */}
            <div style={{ display: "flex", borderBottom: "1px solid #2e2e3f" }}>
              {[
                { key: "upload", label: "📁 새 이미지 업로드" },
                { key: "works", label: "🎨 기존 작품에서 선택" },
              ].map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
                  flex: 1, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: "none",
                  background: activeTab === t.key ? "rgba(99,102,241,0.1)" : "#0a0a0f",
                  color: activeTab === t.key ? "#818cf8" : "#55556e",
                  borderBottom: activeTab === t.key ? "2px solid #6366f1" : "2px solid transparent",
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ padding: 16 }}>
              {activeTab === "upload" ? (
                <div {...getRootProps()} style={{ border: "2px dashed #2e2e3f", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: "#0a0a0f" }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                  <p style={{ color: "#9999bb", fontSize: 13 }}>{uploadingHero ? "업로드 중..." : "클릭하거나 이미지를 드래그 (최대 6장)"}</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#9999bb", fontSize: 13, marginBottom: 12 }}>작품 이미지를 클릭하면 히어로에 추가됩니다</p>
                  {allWorks.length === 0 ? (
                    <p style={{ color: "#55556e", fontSize: 13 }}>등록된 작품이 없습니다.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                      {allWorks.flatMap((w) =>
                        (w.images || []).map((img, i) => {
                          const isSelected = heroImages.some((h) => h.url === img);
                          return (
                            <div key={`${w.id}-${i}`} onClick={() => !isSelected && addFromWork(img)} style={{
                              position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                              cursor: isSelected ? "default" : "pointer",
                              border: isSelected ? "2px solid #6366f1" : "2px solid transparent",
                              opacity: isSelected ? 0.6 : 1,
                            }}>
                              <img src={img} alt={w.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              {isSelected && (
                                <div style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✓</div>
                              )}
                              {!isSelected && (
                                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, opacity: 0, transition: "all 0.2s" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.4)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0)"; (e.currentTarget as HTMLElement).style.opacity = "0"; }}>
                                  ＋
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 이미지 스타일 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🎨 이미지 스타일</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 10 }}>모서리 스타일</label>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ key: "rounded", label: "⬜ 둥근 모서리", preview: 14 }, { key: "square", label: "🟥 직각 모서리", preview: 0 }].map((t) => (
                <button key={t.key} onClick={() => setBorderRadius(t.key as any)} style={{
                  flex: 1, padding: "14px", borderRadius: 10, cursor: "pointer",
                  border: borderRadius === t.key ? "2px solid #6366f1" : "1px solid #2e2e3f",
                  background: borderRadius === t.key ? "rgba(99,102,241,0.1)" : "#0a0a0f",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 32, height: 32, background: "#6366f1", borderRadius: t.preview, flexShrink: 0 }} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#f0f0ff" }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 10 }}>이미지 테두리 색상</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={borderColor === "transparent" ? "#000000" : borderColor} onChange={(e) => setBorderColor(e.target.value)}
                  style={{ width: 48, height: 48, borderRadius: 8, cursor: "pointer", border: "none", background: "none", padding: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0ff" }}>직접 선택</div>
                  <div style={{ fontSize: 11, color: "#55556e" }}>{borderColor}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { color: "#2e2e3f", label: "기본" },
                  { color: "#6366f1", label: "인디고" },
                  { color: "#22d3ee", label: "시안" },
                  { color: "#ffffff", label: "흰색" },
                  { color: "#000000", label: "검정" },
                  { color: "transparent", label: "없음" },
                ].map((p) => (
                  <button key={p.color} onClick={() => setBorderColor(p.color)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color === "transparent" ? "repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 10px 10px" : p.color, border: borderColor === p.color ? "2px solid #6366f1" : "2px solid #2e2e3f" }} />
                    <span style={{ fontSize: 10, color: "#55556e" }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* 미리보기 */}
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 72, height: 72, background: "#1a1a24", borderRadius: borderRadius === "rounded" ? 10 : 0, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#55556e" }}>🎨</div>
              ))}
              <div style={{ display: "flex", alignItems: "center", color: "#55556e", fontSize: 12, marginLeft: 8 }}>← 미리보기</div>
            </div>
          </div>
        </div>

        {/* 레이아웃 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📐 레이아웃 설정</h2>
          <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 8 }}>홈페이지 최대 너비</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {["1280", "1440", "1600", "1920", "100%"].map((w) => (
              <button key={w} onClick={() => setMaxWidth(w)} style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: maxWidth === w ? "2px solid #6366f1" : "1px solid #2e2e3f",
                background: maxWidth === w ? "rgba(99,102,241,0.15)" : "#0a0a0f",
                color: maxWidth === w ? "#818cf8" : "#9999bb",
              }}>{w}{w !== "100%" ? "px" : " (전체)"}</button>
            ))}
          </div>
          <input value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)} placeholder="직접 입력 (예: 1400)" style={{ ...inputStyle, maxWidth: 200 }} />
        </div>

        {/* 통계 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📊 메인 통계 수치</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[{ key: "students", label: "등록 학생" }, { key: "works", label: "등록 작품" }, { key: "companies", label: "협력 기업" }, { key: "employment", label: "취업 연계율" }].map((s) => (
              <div key={s.key}>
                <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>{s.label}</label>
                <input value={(stats as any)[s.key]} onChange={(e) => setStats({ ...stats, [s.key]: e.target.value })} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>✍️ 하단 CTA 텍스트</h2>
          <textarea value={ctaText} onChange={(e) => setCtaText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
        </div>

        <button onClick={saveSettings} disabled={saving} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1, boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
          {saving ? "저장 중..." : "💾 모든 설정 저장하기"}
        </button>

        {/* 카테고리 */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏷️ 작품 카테고리 관리</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder="새 카테고리 이름..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addCategory} style={{ background: "#6366f1", color: "white", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>추가</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", fontSize: 13 }}>
                {c.name}
                <button onClick={() => deleteCategory(c.id)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
              </div>
            ))}
            {categories.length === 0 && <p style={{ color: "#55556e", fontSize: 13 }}>카테고리가 없습니다.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
