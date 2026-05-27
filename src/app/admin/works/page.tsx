"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Work {
  id: string; title: string; authorName: string; authorUid: string;
  category: string|string[]; images: string[]; isPublic: boolean;
  isFeatured: boolean; viewCount: number; createdAt: any;
}

export default function AdminWorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db,"works"));
        const list = snap.docs
          .map((d) => ({ id:d.id, ...d.data() } as Work))
          .sort((a,b) => (b.createdAt?.seconds??0) - (a.createdAt?.seconds??0));
        setWorks(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const togglePublic = async (id:string, current:boolean) => {
    await updateDoc(doc(db,"works",id), { isPublic:!current });
    setWorks((p) => p.map((w) => w.id===id ? {...w,isPublic:!current} : w));
  };

  const toggleFeatured = async (id:string, current:boolean) => {
    await updateDoc(doc(db,"works",id), { isFeatured:!current });
    setWorks((p) => p.map((w) => w.id===id ? {...w,isFeatured:!current} : w));
  };

  const deleteWork = async (id:string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db,"works",id));
    setWorks((p) => p.filter((w) => w.id!==id));
  };

  const cat = (c:string|string[]) => Array.isArray(c) ? c.join(", ") : c;

  // ③ 작품명 + 학생이름 검색
  const filtered = works.filter((w) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      w.title?.toLowerCase().includes(s) ||
      w.authorName?.toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>작품 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:24 }}>전체 {works.length}개 작품</p>

        {/* 검색 */}
        <div style={{ position:"relative", maxWidth:440, marginBottom:28 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#55556e", fontSize:16 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="작품명 또는 학생 이름으로 검색"
            style={{ width:"100%", background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, color:"#f0f0ff", padding:"11px 14px 11px 42px", fontSize:14, boxSizing:"border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#55556e", cursor:"pointer", fontSize:16 }}>✕</button>
          )}
        </div>

        {search && (
          <p style={{ color:"#818cf8", fontSize:13, marginBottom:16 }}>
            "{search}" 검색 결과: <strong>{filtered.length}</strong>개
          </p>
        )}

        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#55556e" }}>
            {search ? `"${search}"에 해당하는 작품이 없습니다.` : "등록된 작품이 없습니다."}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((w) => (
              <div key={w.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                {/* 썸네일 */}
                <div style={{ width:56, height:56, borderRadius:8, overflow:"hidden", background:"#1a1a24", flexShrink:0 }}>
                  {w.images?.[0]
                    ? <img src={w.images[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🎨</div>}
                </div>

                {/* 정보 */}
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:"#f0f0ff", marginBottom:3 }}>{w.title}</div>
                  <div style={{ color:"#818cf8", fontSize:13 }}>👤 {w.authorName || "(이름 없음)"}</div>
                  <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>
                    {cat(w.category)} · 조회 {w.viewCount??0}
                  </div>
                </div>

                {/* 상태 뱃지 */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button onClick={() => togglePublic(w.id, w.isPublic)}
                    style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                      background:w.isPublic?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                      color:w.isPublic?"#10b981":"#ef4444" }}>
                    {w.isPublic?"✅ 공개":"🔒 비공개"}
                  </button>
                  <button onClick={() => toggleFeatured(w.id, w.isFeatured)}
                    style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                      background:w.isFeatured?"rgba(234,179,8,0.15)":"rgba(85,85,110,0.2)",
                      color:w.isFeatured?"#eab308":"#55556e" }}>
                    {w.isFeatured?"⭐ 추천":"☆ 일반"}
                  </button>
                  <Link href={`/work/${w.id}`}
                    style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, textDecoration:"none",
                      background:"rgba(99,102,241,0.15)", color:"#818cf8" }}>
                    보기
                  </Link>
                  <button onClick={() => deleteWork(w.id)}
                    style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, border:"none", cursor:"pointer",
                      background:"rgba(239,68,68,0.1)", color:"#ef4444" }}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
