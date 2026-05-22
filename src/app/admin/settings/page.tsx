"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();

  const [stats, setStats] = useState({ students: "120+", works: "850+", companies: "30+", employment: "95%" });
  const [ctaText, setCtaText] = useState("학교 이메일로 가입하고 무료로 시작하세요");
  const [heroTitle, setHeroTitle] = useState("당신의");
  const [heroSubtitle, setHeroSubtitle] = useState("작품을");
  const [heroTagline, setHeroTagline] = useState("세상에.");
  const [heroDescription, setHeroDescription] = useState("웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고 산업체 인사 담당자와 직접 연결되는 플랫폼");
  const [heroType, setHeroType] = useState<"grid" | "slide">("grid");
  const [borderRadius, setBorderRadius] = useState<"rounded" | "square">("rounded");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [heroImages, setHeroImages] = useState<{ id: string; url: string }[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchAll();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchAll = async () => {
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
    }
    const catSnap = await getDocs(collection(db, "categories"));
    setCategories(catSnap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    const heroSnap = await getDocs(collection(db, "heroImages"));
    setHeroImages(heroSnap.docs.map((d) => ({ id: d.id, url: d.data().url })));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "main"), {
        stats, ctaText, heroTitle, heroSubtitle, heroTagline, heroDescription,
        heroType, borderRadius, updatedAt: serverTimestamp()
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
    toast.success("삭제됨");
  };

  const deleteHeroImage = async (id: string) => {
    await deleteDoc(doc(db, "heroImages", id));
    setHeroImages((prev) => prev.filter((h) => h.id !== id));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] }, maxFiles: 6,
    onDrop: async (files) => {
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

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  const inputStyle = { width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" };

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
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
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
          {/* 설명 텍스트 */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>설명 텍스트</label>
            <textarea
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              rows={3}
              placeholder="웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고..."
              style={{ ...inputStyle, resize: "none" }}
            />
            <p style={{ fontSize: 11, color: "#55556e", marginTop: 4 }}>히어로 섹션 제목 아래 설명 문구입니다.</p>
          </div>
        </div>

        {/* 히어로 타입 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🖼️ 히어로 이미지 표시 방식</h2>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {[{ key: "grid", label: "📐 그리드", desc: "비대칭 그리드 레이아웃" }, { key: "slide", label: "🎞️ 슬라이드", desc: "자동 슬라이드쇼" }].map((t) => (
              <button key={t.key} onClick={() => setHeroType(t.key as any)} style={{ flex: 1, padding: "16px", borderRadius: 10, cursor: "pointer", textAlign: "left", border: heroType === t.key ? "2px solid #6366f1" : "1px solid #2e2e3f", background: heroType === t.key ? "rgba(99,102,241,0.1)" : "#0a0a0f" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0ff", marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#55556e" }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <div {...getRootProps()} style={{ border: "2px dashed #2e2e3f", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer", background: "#0a0a0f", marginBottom: 16 }}>
            <input {...getInputProps()} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
            <p style={{ color: "#9999bb", fontSize: 13 }}>{uploadingHero ? "업로드 중..." : "클릭하거나 이미지를 드래그 (최대 6장)"}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {heroImages.map((h) => (
              <div key={h.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                <img src={h.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => deleteHeroImage(h.id)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.8)", color: "white", border: "none", cursor: "pointer", fontSize: 10 }}>✕</button>
              </div>
            ))}
            {heroImages.length === 0 && <p style={{ color: "#55556e", fontSize: 12, gridColumn: "1/-1" }}>등록된 이미지가 없습니다.</p>}
          </div>
        </div>

        {/* 이미지 모서리 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔲 이미지 모서리 스타일</h2>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ key: "rounded", label: "⬜ 둥근 모서리" }, { key: "square", label: "🟥 직각 모서리" }].map((t) => (
              <button key={t.key} onClick={() => setBorderRadius(t.key as any)} style={{ flex: 1, padding: "14px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: borderRadius === t.key ? "2px solid #6366f1" : "1px solid #2e2e3f", background: borderRadius === t.key ? "rgba(99,102,241,0.1)" : "#0a0a0f", fontWeight: 700, fontSize: 14, color: "#f0f0ff" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
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

        {/* CTA 텍스트 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>✍️ 하단 CTA 텍스트</h2>
          <textarea value={ctaText} onChange={(e) => setCtaText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
        </div>

        {/* 저장 버튼 */}
        <button onClick={saveSettings} disabled={saving} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1, boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
          {saving ? "저장 중..." : "💾 모든 설정 저장하기"}
        </button>

        {/* 카테고리 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
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
