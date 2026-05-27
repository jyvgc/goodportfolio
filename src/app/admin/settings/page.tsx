"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [heroTitle, setHeroTitle] = useState("당신의");
  const [heroSubtitle, setHeroSubtitle] = useState("작품을");
  const [heroTagline, setHeroTagline] = useState("세상에.");
  const [heroDescription, setHeroDescription] = useState("웹툰 · 게임콘텐츠 학생들의 포트폴리오를 전시하고 산업체 인사 담당자와 직접 연결되는 플랫폼");
  const [heroBadgeText, setHeroBadgeText] = useState("구미대학교 공식 포트폴리오 플랫폼");
  const [heroType, setHeroType] = useState<"grid"|"slide"|"square">("grid");
  const [borderRadius, setBorderRadius] = useState<"rounded"|"square">("rounded");
  const [borderColor, setBorderColor] = useState("#2e2e3f");
  const [maxWidth, setMaxWidth] = useState("1280");
  const [ctaText, setCtaText] = useState("학교 이메일로 가입하고 무료로 시작하세요");
  const [stats, setStats] = useState({ students:"120+", works:"850+", companies:"30+", employment:"95%" });
  const [categories, setCategories] = useState<string[]>(["웹툰","게임아트","캐릭터","배경","UI/UX","3D"]);
  const [newCategory, setNewCategory] = useState("");
  const [tools, setTools] = useState<string[]>(["Photoshop","Illustrator","Clip Studio","Procreate","Blender","Maya","Unity","Figma"]);
  const [newTool, setNewTool] = useState("");
  const [snsEnabled, setSnsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db,"settings","main"));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.heroTitle) setHeroTitle(d.heroTitle);
      if (d.heroSubtitle) setHeroSubtitle(d.heroSubtitle);
      if (d.heroTagline) setHeroTagline(d.heroTagline);
      if (d.heroDescription) setHeroDescription(d.heroDescription);
      if (d.heroBadgeText) setHeroBadgeText(d.heroBadgeText);
      if (d.heroType) setHeroType(d.heroType);
      if (d.borderRadius) setBorderRadius(d.borderRadius);
      if (d.borderColor) setBorderColor(d.borderColor);
      if (d.maxWidth) setMaxWidth(d.maxWidth);
      if (d.ctaText) setCtaText(d.ctaText);
      if (d.stats) setStats(d.stats);
      if (d.categories) setCategories(d.categories);
      if (d.tools) setTools(d.tools);
      if (typeof d.snsEnabled === "boolean") setSnsEnabled(d.snsEnabled);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db,"settings","main"), {
      heroTitle,heroSubtitle,heroTagline,heroDescription,heroBadgeText,
      heroType,borderRadius,borderColor,maxWidth,ctaText,stats,
      categories,tools,snsEnabled,
    }, { merge:true });
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 3000);
  };

  const inp = (label:string, val:string, set:(v:string)=>void, placeholder="") => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>{label}</label>
      <input value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
    </div>
  );

  const section = (title:string, children:React.ReactNode) => (
    <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:28, marginBottom:20 }}>
      <h2 style={{ fontSize:15, fontWeight:700, color:"#818cf8", marginBottom:20 }}>{title}</h2>
      {children}
    </div>
  );

  const chipList = (items:string[], onRemove:(v:string)=>void) => (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
      {items.map((item) => (
        <span key={item} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background:"#1a1a24", border:"1px solid #2e2e3f", fontSize:13, color:"#f0f0ff" }}>
          {item}
          <button onClick={() => onRemove(item)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>✕</button>
        </span>
      ))}
    </div>
  );

  const addItem = (val:string, list:string[], setList:(v:string[])=>void, setVal:(v:string)=>void) => {
    const v = val.trim();
    if (v && !list.includes(v)) { setList([...list, v]); setVal(""); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:800, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>사이트 설정</h1>

        {section("🏷 상단 뱃지 텍스트", inp("뱃지 문구", heroBadgeText, setHeroBadgeText, "구미대학교 공식 포트폴리오 플랫폼"))}

        {section("🖼 히어로 섹션", <>
          {inp("메인 타이틀 1줄", heroTitle, setHeroTitle)}
          {inp("메인 타이틀 2줄 (그라데이션)", heroSubtitle, setHeroSubtitle)}
          {inp("메인 타이틀 3줄", heroTagline, setHeroTagline)}
          {inp("설명 문구", heroDescription, setHeroDescription)}
          {inp("CTA 문구", ctaText, setCtaText)}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>히어로 이미지 타입</label>
            <select value={heroType} onChange={(e) => setHeroType(e.target.value as any)}
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14 }}>
              <option value="grid">Grid</option>
              <option value="slide">Slide</option>
              <option value="square">Square</option>
            </select>
          </div>
        </>)}

        {section("📊 통계", <>
          {(["students","works","companies","employment"] as const).map((k) =>
            inp(k==="students"?"등록 학생":k==="works"?"등록 작품":k==="companies"?"협력 기업":"취업 연계율",
              stats[k], (v) => setStats((p) => ({...p,[k]:v})))
          )}
        </>)}

        {section("🏷 카테고리 관리", <>
          {chipList(categories, (c) => setCategories((p) => p.filter((x) => x!==c)))}
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key==="Enter" && addItem(newCategory,categories,setCategories,setNewCategory)}
              placeholder="새 카테고리 입력 후 Enter 또는 추가 버튼"
              style={{ flex:1, background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14 }} />
            <button onClick={() => addItem(newCategory,categories,setCategories,setNewCategory)}
              style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:600, cursor:"pointer" }}>추가</button>
          </div>
        </>)}

        {section("🔧 사용 툴 관리", <>
          {chipList(tools, (t) => setTools((p) => p.filter((x) => x!==t)))}
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <input value={newTool} onChange={(e) => setNewTool(e.target.value)}
              onKeyDown={(e) => e.key==="Enter" && addItem(newTool,tools,setTools,setNewTool)}
              placeholder="새 툴 입력 후 Enter 또는 추가 버튼"
              style={{ flex:1, background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14 }} />
            <button onClick={() => addItem(newTool,tools,setTools,setNewTool)}
              style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:600, cursor:"pointer" }}>추가</button>
          </div>
        </>)}

        {section("🔗 SNS 링크 설정",
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ color:"#9999bb", fontSize:14 }}>학생 프로필 SNS 링크 기능</span>
            <button onClick={() => setSnsEnabled((p) => !p)}
              style={{ padding:"8px 24px", borderRadius:999, fontWeight:700, fontSize:13, border:"none", cursor:"pointer",
                background:snsEnabled?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                color:snsEnabled?"#10b981":"#ef4444" }}>
              {snsEnabled?"✅ 사용함":"❌ 사용 안함"}
            </button>
          </div>
        )}

        <button onClick={save} disabled={saving}
          style={{ width:"100%", background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:12, padding:"16px 0", fontWeight:700, fontSize:16, cursor:saving?"not-allowed":"pointer" }}>
          {saving?"저장 중...":done?"✅ 저장 완료!":"전체 설정 저장"}
        </button>
      </div>
      <Footer />
    </div>
  );
}
