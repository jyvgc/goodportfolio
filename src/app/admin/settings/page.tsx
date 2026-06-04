"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface HeroImageItem { workId: string; url: string; title: string; order: number; }

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
  const [statsMode, setStatsMode] = useState<"live"|"manual">("manual");
  const [stats, setStats] = useState({ students:"120+", works:"850+", companies:"30+", employment:"95%" });
  const [liveStats, setLiveStats] = useState({ students:0, works:0, companies:0 });
  const [categories, setCategories] = useState<string[]>(["웹툰","게임아트","캐릭터","배경","UI/UX","3D"]);
  const [newCategory, setNewCategory] = useState("");
  const [tools, setTools] = useState<string[]>(["Photoshop","Illustrator","Clip Studio","Procreate","Blender","Maya","Unity","Figma"]);
  const [newTool, setNewTool] = useState("");
  const [snsEnabled, setSnsEnabled] = useState(true);
  const [featuredWorks, setFeaturedWorks] = useState<any[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImageItem[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadFeaturedWorks();
    loadLiveStats();
  }, []);

  const loadSettings = async () => {
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
    if (d.statsMode) setStatsMode(d.statsMode);
    if (d.stats) setStats(d.stats);
    if (d.categories) setCategories(d.categories);
    if (d.tools) setTools(d.tools);
    if (typeof d.snsEnabled === "boolean") setSnsEnabled(d.snsEnabled);
    if (d.heroImages) setHeroImages(d.heroImages);
  };

  const loadLiveStats = async () => {
    try {
      const [sSnap, wSnap, cSnap] = await Promise.all([
        getDocs(query(collection(db,"users"), where("role","==","student"))),
        getDocs(collection(db,"works")),
        getDocs(query(collection(db,"users"), where("role","==","company"))),
      ]);
      setLiveStats({ students:sSnap.size, works:wSnap.size, companies:cSnap.size });
    } catch(e) { console.error(e); }
  };

  const loadFeaturedWorks = async () => {
    try {
      const snap = await getDocs(query(collection(db,"works"), where("isFeatured","==",true)));
      setFeaturedWorks(snap.docs.map((d) => ({ id:d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    finally { setWorksLoading(false); }
  };

  const toggleHeroImage = (work: any) => {
    const exists = heroImages.find((h) => h.workId === work.id);
    if (exists) {
      setHeroImages((p) => p.filter((h) => h.workId !== work.id));
    } else {
      setHeroImages((p) => [...p, { workId:work.id, url:work.images?.[0]??"", title:work.title??"", order:p.length }]);
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setHeroImages((p) => {
      const arr = [...p];
      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
      return arr.map((item, i) => ({ ...item, order:i }));
    });
  };

  const moveDown = (idx: number) => {
    setHeroImages((p) => {
      if (idx === p.length-1) return p;
      const arr = [...p];
      [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
      return arr.map((item, i) => ({ ...item, order:i }));
    });
  };

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db,"settings","main"), {
      heroTitle,heroSubtitle,heroTagline,heroDescription,heroBadgeText,
      heroType,borderRadius,borderColor,maxWidth,ctaText,
      statsMode,stats,categories,tools,snsEnabled,heroImages,
    }, { merge:true });
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 3000);
  };

  const inp = (label:string, val:string, set:(v:string)=>void) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>{label}</label>
      <input value={val} onChange={(e) => set(e.target.value)}
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
          <button onClick={() => onRemove(item)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
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

        {section("🏷 상단 뱃지 텍스트", inp("뱃지 문구", heroBadgeText, setHeroBadgeText))}

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

        {/* ① 통계 - 실시간/수동 선택 */}
        {section("📊 통계", <>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {[{val:"live",label:"🔴 실시간 반영"},{val:"manual",label:"✏️ 직접 입력"}].map((m) => (
              <button key={m.val} onClick={() => setStatsMode(m.val as any)}
                style={{ flex:1, padding:"10px 0", borderRadius:8, fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                  background:statsMode===m.val?"#6366f1":"#1a1a24", color:statsMode===m.val?"white":"#9999bb" }}>
                {m.label}
              </button>
            ))}
          </div>
          {statsMode === "live" ? (
            <div style={{ background:"#1a1a24", borderRadius:10, padding:16 }}>
              <p style={{ color:"#818cf8", fontSize:13, marginBottom:12 }}>🔴 실시간으로 Firestore 데이터를 반영합니다.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                {[{label:"등록 학생",value:liveStats.students},{label:"등록 작품",value:liveStats.works},{label:"협력 기업",value:liveStats.companies}].map((s) => (
                  <div key={s.label} style={{ background:"#111118", borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:24, fontWeight:900, color:"#6366f1" }}>{s.value}</div>
                    <div style={{ color:"#55556e", fontSize:12, marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {inp("취업 연계율 (직접 입력)", stats.employment, (v) => setStats((p) => ({...p, employment:v})))}
            </div>
          ) : (
            <>
              {(["students","works","companies","employment"] as const).map((k) =>
                inp(k==="students"?"등록 학생":k==="works"?"등록 작품":k==="companies"?"협력 기업":"취업 연계율",
                  stats[k], (v) => setStats((p) => ({...p,[k]:v})))
              )}
            </>
          )}
        </>)}

        {/* ② 히어로 이미지 관리 */}
        {section("🖼 히어로 이미지 관리", <>
          <p style={{ color:"#55556e", fontSize:13, marginBottom:16 }}>
            ⭐ <strong style={{ color:"#9999bb" }}>추천(대표작)</strong>으로 설정된 작품만 선택 가능합니다.<br />
            작품 관리에서 ⭐ 추천으로 설정하면 여기에 나타납니다.
          </p>

          {heroImages.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:"#818cf8", marginBottom:12 }}>선택된 히어로 이미지 ({heroImages.length}개) - 순서 조정</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {heroImages.map((item, idx) => (
                  <div key={item.workId} style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a24", borderRadius:8, padding:"10px 14px" }}>
                    <span style={{ color:"#55556e", fontSize:13, fontWeight:700, width:24 }}>{idx+1}</span>
                    <div style={{ width:44, height:44, borderRadius:6, overflow:"hidden", flexShrink:0, background:"#2e2e3f" }}>
                      {item.url ? <img src={item.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎨</div>}
                    </div>
                    <div style={{ flex:1, fontSize:13, color:"#f0f0ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => moveUp(idx)} disabled={idx===0}
                        style={{ padding:"4px 10px", borderRadius:6, background:"#2e2e3f", border:"none", color:idx===0?"#3d3d52":"#9999bb", cursor:idx===0?"not-allowed":"pointer" }}>↑</button>
                      <button onClick={() => moveDown(idx)} disabled={idx===heroImages.length-1}
                        style={{ padding:"4px 10px", borderRadius:6, background:"#2e2e3f", border:"none", color:idx===heroImages.length-1?"#3d3d52":"#9999bb", cursor:idx===heroImages.length-1?"not-allowed":"pointer" }}>↓</button>
                      <button onClick={() => setHeroImages((p) => p.filter((h) => h.workId !== item.workId))}
                        style={{ padding:"4px 10px", borderRadius:6, background:"rgba(239,68,68,0.1)", border:"none", color:"#ef4444", cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={{ fontSize:13, fontWeight:700, color:"#818cf8", marginBottom:12 }}>추천 작품 목록</h3>
          {worksLoading ? <p style={{ color:"#55556e" }}>⏳ 불러오는 중...</p>
          : featuredWorks.length === 0 ? (
            <div style={{ background:"#1a1a24", borderRadius:8, padding:20, textAlign:"center", color:"#55556e", fontSize:13 }}>
              추천 작품이 없습니다. 작품 관리에서 ⭐ 추천으로 설정해주세요.
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
              {featuredWorks.map((w: any) => {
                const isSelected = heroImages.some((h) => h.workId === w.id);
                return (
                  <div key={w.id} onClick={() => toggleHeroImage(w)}
                    style={{ cursor:"pointer", borderRadius:10, overflow:"hidden",
                      border:`2px solid ${isSelected?"#6366f1":"#2e2e3f"}`,
                      background:isSelected?"rgba(99,102,241,0.1)":"#1a1a24", transition:"all 0.2s" }}>
                    <div style={{ aspectRatio:"1", overflow:"hidden" }}>
                      {w.images?.[0]
                        ? <img src={w.images[0]} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎨</div>}
                    </div>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:isSelected?"#818cf8":"#f0f0ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                      {isSelected && <div style={{ fontSize:11, color:"#6366f1", marginTop:2 }}>✅ 선택됨</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {section("🏷 카테고리 관리", <>
          {chipList(categories, (c) => setCategories((p) => p.filter((x) => x!==c)))}
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key==="Enter" && addItem(newCategory,categories,setCategories,setNewCategory)}
              placeholder="새 카테고리 입력"
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
              placeholder="새 툴 입력"
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
