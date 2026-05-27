"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Work { id:string; title:string; category:string|string[]; images:string[]; authorName:string; viewCount:number; }

export default function GalleryPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [selected, setSelected] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [wSnap, sSnap] = await Promise.all([
          getDocs(query(collection(db,"works"), where("isPublic","==",true))),
          getDoc(doc(db,"settings","main")),
        ]);
        const list = wSnap.docs
          .map((d) => ({ id:d.id, ...d.data() } as Work))
          .sort((a:any,b:any) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
        setWorks(list);
        // ① 관리자 설정 카테고리 불러오기
        if (sSnap.exists() && sSnap.data().categories?.length) {
          setCategories(["ALL", ...sSnap.data().categories]);
        } else {
          setCategories(["ALL","웹툰","게임아트","캐릭터","배경","UI/UX","3D"]);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = works.filter((w) => {
    const matchCat = selected==="ALL" || (Array.isArray(w.category) ? w.category.includes(selected) : w.category===selected);
    const matchSearch = !search.trim() || w.title?.toLowerCase().includes(search.toLowerCase()) || w.authorName?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cat = (c:string|string[]) => Array.isArray(c) ? c[0] : c;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ marginBottom:40 }}>
          <h1 style={{ fontSize:36, fontWeight:900, marginBottom:8 }}>갤러리</h1>
          <p style={{ color:"#9999bb", fontSize:16 }}>학생들의 포트폴리오 작품을 감상하세요</p>
        </div>

        {/* 검색 */}
        <div style={{ position:"relative", maxWidth:440, marginBottom:24 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#55556e" }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="작품명 또는 학생 이름 검색"
            style={{ width:"100%", background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, color:"#f0f0ff", padding:"11px 14px 11px 42px", fontSize:14, boxSizing:"border-box" }} />
          {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#55556e", cursor:"pointer", fontSize:16 }}>✕</button>}
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display:"flex", gap:8, marginBottom:40, overflowX:"auto", paddingBottom:8 }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setSelected(c)}
              style={{ flexShrink:0, padding:"8px 20px", borderRadius:999, fontSize:13, fontWeight:600, cursor:"pointer",
                border: selected===c ? "none" : "1px solid #2e2e3f",
                background: selected===c ? "#6366f1" : "#111118",
                color: selected===c ? "white" : "#9999bb" }}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
            <p style={{ color:"#9999bb" }}>작품이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
            {filtered.map((w) => (
              <Link key={w.id} href={`/work/${w.id}`} style={{ textDecoration:"none" }}>
                <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, overflow:"hidden", transition:"all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 40px rgba(99,102,241,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>
                  <div style={{ aspectRatio:"1", background:"#1a1a24", overflow:"hidden" }}>
                    {w.images?.[0]
                      ? <img src={w.images[0]} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🎨</div>}
                  </div>
                  <div style={{ padding:14 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#f0f0ff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"rgba(99,102,241,0.15)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.3)" }}>{cat(w.category)}</span>
                      <span style={{ fontSize:11, color:"#55556e" }}>👁 {w.viewCount??0}</span>
                    </div>
                    {w.authorName && <div style={{ color:"#55556e", fontSize:12, marginTop:4 }}>👤 {w.authorName}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
