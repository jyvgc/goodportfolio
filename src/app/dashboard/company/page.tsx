"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface SavedPortfolio {
  id: string;
  workId: string;
  workTitle: string;
  workImage: string;
  authorName: string;
  authorUid: string;
  memo: string;
  savedAt: any;
  updatedAt: any;
}

export default function CompanyDashboard() {
  const { firebaseUser, userDoc } = useAuthStore();
  const [saved, setSaved] = useState<SavedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const q = query(collection(db, "savedPortfolios"), where("companyUid", "==", firebaseUser.uid));
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as SavedPortfolio))
          .sort((a, b) => (b.savedAt?.seconds ?? 0) - (a.savedAt?.seconds ?? 0));
        setSaved(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [firebaseUser]);

  const startEdit = (item: SavedPortfolio) => {
    setEditingId(item.id);
    setEditMemo(item.memo ?? "");
  };

  const saveMemo = async (id: string) => {
    setSavingId(id);
    try {
      await updateDoc(doc(db, "savedPortfolios", id), { memo: editMemo, updatedAt: new Date() });
      setSaved((p) => p.map((s) => s.id === id ? { ...s, memo: editMemo } : s));
      setEditingId(null);
    } catch(e) { console.error(e); }
    finally { setSavingId(null); }
  };

  const fmt = (ts: any) => {
    if (!ts) return "-";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
    } catch { return "-"; }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900 }}>기업 대시보드</h1>
            <p style={{ color:"#9999bb", marginTop:4 }}>{userDoc?.displayName ?? ""} 님, 환영합니다!</p>
          </div>
          <Link href="/dashboard/company/profile"
            style={{ background:"#6366f1", color:"#fff", padding:"10px 24px", borderRadius:8, textDecoration:"none", fontWeight:600, fontSize:14 }}>
            회사 정보 수정
          </Link>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <div style={{ width:32, height:1, background:"#6366f1" }} />
          <h2 style={{ fontSize:18, fontWeight:700 }}>🔖 관심 포트폴리오 ({saved.length})</h2>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : saved.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#55556e" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔖</div>
            <p>아직 등록한 관심 포트폴리오가 없습니다.</p>
            <Link href="/gallery" style={{ color:"#6366f1", marginTop:12, display:"inline-block", fontWeight:600 }}>갤러리에서 작품 둘러보기 →</Link>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {saved.map((item) => (
              <div key={item.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:14, padding:20 }}>
                <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                  {/* 썸네일 */}
                  <Link href={`/work/${item.workId}`} style={{ flexShrink:0 }}>
                    <div style={{ width:80, height:80, borderRadius:10, overflow:"hidden", background:"#1a1a24" }}>
                      {item.workImage
                        ? <img src={item.workImage} alt={item.workTitle} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🎨</div>}
                    </div>
                  </Link>

                  {/* 정보 */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:6 }}>
                      <div>
                        <Link href={`/work/${item.workId}`} style={{ fontWeight:700, fontSize:16, color:"#f0f0ff", textDecoration:"none" }}>{item.workTitle}</Link>
                        <div style={{ color:"#818cf8", fontSize:13, marginTop:2 }}>👤 {item.authorName}</div>
                      </div>
                      <div style={{ color:"#55556e", fontSize:12, textAlign:"right" }}>
                        <div>📅 등록: {fmt(item.savedAt)}</div>
                        {item.updatedAt?.seconds !== item.savedAt?.seconds && <div>✏️ 수정: {fmt(item.updatedAt)}</div>}
                      </div>
                    </div>

                    {/* 메모 */}
                    {editingId === item.id ? (
                      <div style={{ marginTop:10 }}>
                        <textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3}
                          style={{ width:"100%", background:"#1a1a24", border:"1px solid #6366f1", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box", marginBottom:8 }} />
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => saveMemo(item.id)} disabled={savingId===item.id}
                            style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", fontWeight:600, cursor:"pointer" }}>
                            {savingId===item.id ? "저장 중..." : "저장"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f", borderRadius:8, padding:"8px 20px", fontWeight:600, cursor:"pointer" }}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop:8, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                        <div style={{ flex:1 }}>
                          {item.memo
                            ? <p style={{ color:"#9999bb", fontSize:14, lineHeight:1.6, margin:0, background:"#1a1a24", borderRadius:8, padding:"10px 14px" }}>{item.memo}</p>
                            : <p style={{ color:"#3d3d52", fontSize:13, margin:0, fontStyle:"italic" }}>메모 없음</p>}
                        </div>
                        <button onClick={() => startEdit(item)}
                          style={{ background:"rgba(99,102,241,0.15)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.3)", borderRadius:8, padding:"7px 16px", fontWeight:600, fontSize:13, cursor:"pointer", flexShrink:0 }}>
                          ✏️ 메모 수정
                        </button>
                      </div>
                    )}
                  </div>
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
