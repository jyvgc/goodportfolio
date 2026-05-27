"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Company {
  id: string; displayName: string; email: string; companyName: string;
  industry: string; companySize: string; phone: string; website: string;
  isApproved: boolean; createdAt: any;
}

interface SavedPortfolio {
  id: string; workTitle: string; authorName: string; savedAt: any;
}

const PER_PAGE = 10;

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Company | null>(null);
  const [savedList, setSavedList] = useState<SavedPortfolio[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [uSnap, pSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "companyProfiles")),
        ]);
        const profiles: Record<string, any> = {};
        pSnap.docs.forEach((d) => { profiles[d.id] = d.data(); });
        const list = uSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((u: any) => u.role === "company")
          .map((u: any) => ({ ...u, ...profiles[u.id] }))
          .sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setCompanies(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleApprove = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "users", id), { isApproved: !current });
    setCompanies((p) => p.map((c) => c.id === id ? { ...c, isApproved: !current } : c));
    if (selected?.id === id) setSelected((p) => p ? { ...p, isApproved: !current } : null);
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    await deleteDoc(doc(db, "users", id));
    setCompanies((p) => p.filter((c) => c.id !== id));
    setSelected(null);
  };

  const openDetail = async (company: Company) => {
    setSelected(company);
    setSavedLoading(true);
    try {
      const q = query(collection(db, "savedPortfolios"), where("companyUid", "==", company.id));
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as SavedPortfolio))
        .sort((a: any, b: any) => (b.savedAt?.seconds ?? 0) - (a.savedAt?.seconds ?? 0));
      setSavedList(list);
    } finally { setSavedLoading(false); }
  };

  const fmt = (ts: any) => {
    if (!ts) return "-";
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("ko-KR"); } catch { return "-"; }
  };

  const filtered = companies.filter((c) =>
    !search.trim() || c.companyName?.includes(search) || c.email?.includes(search) || c.displayName?.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>기업 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:24 }}>전체 {companies.length}개 기업 · 승인된 기업만 관심 포트폴리오를 등록할 수 있습니다.</p>

        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="회사명 / 이메일 / 담당자 검색"
          style={{ width:"100%", maxWidth:400, background:"#111118", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, marginBottom:20, boxSizing:"border-box" }} />

        {loading ? <div style={{ textAlign:"center", padding:60, color:"#55556e" }}>⏳ 불러오는 중...</div> : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
              {paginated.map((c) => (
                <div key={c.id} style={{ background:"#111118", border:`1px solid ${selected?.id===c.id?"#6366f1":"#2e2e3f"}`, borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", cursor:"pointer" }}
                  onClick={() => openDetail(c)}>
                  <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background:"linear-gradient(135deg,#22d3ee,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"white" }}>
                    {c.companyName?.charAt(0)||"🏢"}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{c.companyName || "(회사명 없음)"}</div>
                    <div style={{ color:"#9999bb", fontSize:13 }}>{c.email}</div>
                    <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>{c.industry||"-"} · {c.companySize||"-"} · 가입 {fmt(c.createdAt)}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleApprove(c.id, c.isApproved)}
                      style={{ padding:"6px 16px", borderRadius:999, fontWeight:700, fontSize:12, border:"none", cursor:"pointer",
                        background:c.isApproved?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                        color:c.isApproved?"#10b981":"#ef4444" }}>
                      {c.isApproved?"✅ 승인됨":"❌ 미승인"}
                    </button>
                    <button onClick={() => deleteCompany(c.id)}
                      style={{ padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:600, border:"none", cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#ef4444" }}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {paginated.length === 0 && <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>기업이 없습니다.</p>}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1}
                  style={{ padding:"8px 16px", borderRadius:8, background:"#111118", border:"1px solid #2e2e3f", color:page===1?"#3d3d52":"#9999bb", cursor:page===1?"not-allowed":"pointer" }}>‹ 이전</button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ padding:"8px 14px", borderRadius:8, background:page===n?"#6366f1":"#111118", border:"1px solid #2e2e3f", color:page===n?"white":"#9999bb", cursor:"pointer", fontWeight:page===n?700:400 }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  style={{ padding:"8px 16px", borderRadius:8, background:"#111118", border:"1px solid #2e2e3f", color:page===totalPages?"#3d3d52":"#9999bb", cursor:page===totalPages?"not-allowed":"pointer" }}>다음 ›</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, maxWidth:600, width:"100%", maxHeight:"85vh", overflow:"auto", padding:32 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>{selected.companyName || "(회사명 없음)"}</h2>
                <div style={{ color:"#9999bb", fontSize:14 }}>{selected.email}</div>
                <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>가입일: {fmt(selected.createdAt)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:"#55556e", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {/* 상세 정보 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
              {[
                { label:"담당자", value:selected.displayName||"-" },
                { label:"업종", value:(selected as any).industry||"-" },
                { label:"회사 규모", value:(selected as any).companySize||"-" },
                { label:"전화", value:(selected as any).phone||"-" },
                { label:"홈페이지", value:(selected as any).website||"-" },
                { label:"승인 상태", value:selected.isApproved?"✅ 승인됨":"❌ 미승인" },
              ].map((item) => (
                <div key={item.label} style={{ background:"#1a1a24", borderRadius:8, padding:"12px 16px" }}>
                  <div style={{ color:"#55556e", fontSize:12, marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontWeight:600, fontSize:14, wordBreak:"break-all" }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div style={{ display:"flex", gap:8, marginBottom:24 }}>
              <button onClick={() => toggleApprove(selected.id, selected.isApproved)}
                style={{ flex:1, padding:"10px 0", borderRadius:8, fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                  background:selected.isApproved?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",
                  color:selected.isApproved?"#ef4444":"#10b981" }}>
                {selected.isApproved?"❌ 승인 취소":"✅ 승인하기"}
              </button>
              <button onClick={() => deleteCompany(selected.id)}
                style={{ padding:"10px 20px", borderRadius:8, fontWeight:700, fontSize:14, border:"none", cursor:"pointer", background:"rgba(239,68,68,0.15)", color:"#ef4444" }}>
                🗑 삭제
              </button>
            </div>

            {/* 관심 포트폴리오 현황 */}
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#818cf8", marginBottom:16 }}>관심 포트폴리오 ({savedList.length})</h3>
              {savedLoading ? <p style={{ color:"#55556e" }}>⏳ 불러오는 중...</p>
              : savedList.length === 0 ? <p style={{ color:"#55556e", fontSize:13 }}>등록된 관심 포트폴리오가 없습니다.</p>
              : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {savedList.map((item) => (
                    <div key={item.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#1a1a24", borderRadius:8, padding:"10px 14px" }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{item.workTitle}</div>
                        <div style={{ color:"#818cf8", fontSize:12 }}>👤 {item.authorName}</div>
                      </div>
                      <div style={{ color:"#55556e", fontSize:12 }}>{fmt(item.savedAt)}</div>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
