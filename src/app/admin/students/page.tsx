"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

interface Student {
  id: string; displayName: string; email: string;
  department: string; isActive: boolean;
  createdAt: any; profileImage: string; workCount?: number;
}

const PER_PAGE = 10;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Student | null>(null);
  const [selectedWorks, setSelectedWorks] = useState<any[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [uSnap, wSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "works")),
        ]);
        const workCounts: Record<string, number> = {};
        wSnap.docs.forEach((d) => {
          const uid = d.data().authorUid;
          workCounts[uid] = (workCounts[uid] ?? 0) + 1;
        });
        const list = uSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((u: any) => u.role === "student")
          .map((u: any) => ({ ...u, workCount: workCounts[u.id] ?? 0 }))
          .sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setStudents(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "users", id), { isActive: !current });
    setStudents((p) => p.map((s) => s.id === id ? { ...s, isActive: !current } : s));
    if (selected?.id === id) setSelected((p) => p ? { ...p, isActive: !current } : null);
  };

  const deleteStudent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    await deleteDoc(doc(db, "users", id));
    setStudents((p) => p.filter((s) => s.id !== id));
    setSelected(null);
  };

  const toggleWorkPublic = async (workId: string, current: boolean) => {
    await updateDoc(doc(db, "works", workId), { isPublic: !current });
    setSelectedWorks((p) => p.map((w) => w.id === workId ? { ...w, isPublic: !current } : w));
  };

  const openDetail = async (student: Student) => {
    setSelected(student);
    setWorksLoading(true);
    try {
      const q = query(collection(db, "works"), where("authorUid", "==", student.id));
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setSelectedWorks(list);
    } finally { setWorksLoading(false); }
  };

  const fmt = (ts: any) => {
    if (!ts) return "-";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString("ko-KR");
    } catch { return "-"; }
  };

  const filtered = students.filter((s) =>
    !search.trim() || s.displayName?.includes(search) || s.email?.includes(search) || s.department?.includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>학생 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:24 }}>
          전체 {students.length}명 · 활성화된 학생의 작품만 갤러리에 공개됩니다.
        </p>

        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름 / 이메일 / 학과 검색"
          style={{ width:"100%", maxWidth:400, background:"#111118", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, marginBottom:20, boxSizing:"border-box" }} />

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
              {paginated.map((s) => (
                <div key={s.id}
                  style={{ background:"#111118", border:`1px solid ${selected?.id===s.id?"#6366f1":"#2e2e3f"}`, borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", cursor:"pointer" }}
                  onClick={() => openDetail(s)}>
                  <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#6366f1,#22d3ee)" }}>
                    {s.profileImage
                      ? <img src={s.profileImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"white" }}>{s.displayName?.charAt(0)||"?"}</div>}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{s.displayName || "(이름 없음)"}</div>
                    <div style={{ color:"#9999bb", fontSize:13 }}>{s.email}</div>
                    <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>
                      {s.department||"-"} · 작품 {s.workCount}개 · 가입 {fmt(s.createdAt)}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleActive(s.id, s.isActive)}
                      style={{ padding:"6px 16px", borderRadius:999, fontWeight:700, fontSize:12, border:"none", cursor:"pointer",
                        background:s.isActive?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                        color:s.isActive?"#10b981":"#ef4444" }}>
                      {s.isActive?"✅ 활성":"❌ 비활성"}
                    </button>
                    <button onClick={() => deleteStudent(s.id)}
                      style={{ padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:600, border:"none", cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#ef4444" }}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {paginated.length === 0 && (
                <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>학생이 없습니다.</p>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1}
                  style={{ padding:"8px 16px", borderRadius:8, background:"#111118", border:"1px solid #2e2e3f", color:page===1?"#3d3d52":"#9999bb", cursor:page===1?"not-allowed":"pointer" }}>
                  ‹ 이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ padding:"8px 14px", borderRadius:8, background:page===n?"#6366f1":"#111118", border:"1px solid #2e2e3f", color:page===n?"white":"#9999bb", cursor:"pointer", fontWeight:page===n?700:400 }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  style={{ padding:"8px 16px", borderRadius:8, background:"#111118", border:"1px solid #2e2e3f", color:page===totalPages?"#3d3d52":"#9999bb", cursor:page===totalPages?"not-allowed":"pointer" }}>
                  다음 ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, maxWidth:640, width:"100%", maxHeight:"85vh", overflow:"auto", padding:32 }}>

            {/* 모달 헤더 */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <div style={{ width:64, height:64, borderRadius:14, overflow:"hidden", background:"linear-gradient(135deg,#6366f1,#22d3ee)", flexShrink:0 }}>
                  {selected.profileImage
                    ? <img src={selected.profileImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:24, color:"white" }}>{selected.displayName?.charAt(0)||"?"}</div>}
                </div>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>{selected.displayName}</h2>
                  <div style={{ color:"#9999bb", fontSize:14 }}>{selected.email}</div>
                  <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>가입일: {fmt(selected.createdAt)}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background:"none", border:"none", color:"#55556e", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {/* 상세 정보 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
              {[
                { label:"학과", value:selected.department||"-" },
                { label:"작품 수", value:`${selected.workCount}개` },
                { label:"활성화", value:selected.isActive?"✅ 활성화":"❌ 비활성화" },
                { label:"가입일", value:fmt(selected.createdAt) },
              ].map((item) => (
                <div key={item.label} style={{ background:"#1a1a24", borderRadius:8, padding:"12px 16px" }}>
                  <div style={{ color:"#55556e", fontSize:12, marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div style={{ display:"flex", gap:8, marginBottom:24 }}>
              <button onClick={() => toggleActive(selected.id, selected.isActive)}
                style={{ flex:1, padding:"10px 0", borderRadius:8, fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                  background:selected.isActive?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",
                  color:selected.isActive?"#ef4444":"#10b981" }}>
                {selected.isActive?"❌ 비활성화":"✅ 활성화"}
              </button>
              <Link href={`/portfolio/${selected.id}`} target="_blank"
                style={{ flex:1, padding:"10px 0", borderRadius:8, fontWeight:700, fontSize:14, textDecoration:"none", textAlign:"center",
                  background:"rgba(99,102,241,0.15)", color:"#818cf8" }}>
                🎨 포트폴리오 보기
              </Link>
              <button onClick={() => deleteStudent(selected.id)}
                style={{ padding:"10px 20px", borderRadius:8, fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                  background:"rgba(239,68,68,0.15)", color:"#ef4444" }}>
                🗑 삭제
              </button>
            </div>

            {/* 작품 목록 */}
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#818cf8", marginBottom:16 }}>
                등록 작품 ({selectedWorks.length})
              </h3>
              {worksLoading ? (
                <p style={{ color:"#55556e" }}>⏳ 불러오는 중...</p>
              ) : selectedWorks.length === 0 ? (
                <p style={{ color:"#55556e", fontSize:13 }}>등록된 작품이 없습니다.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selectedWorks.map((w: any) => (
                    <div key={w.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#1a1a24", borderRadius:8, padding:"10px 14px" }}>
                      <div style={{ width:48, height:48, borderRadius:6, overflow:"hidden", background:"#2e2e3f", flexShrink:0 }}>
                        {w.images?.[0]
                          ? <img src={w.images[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>🎨</div>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                        <div style={{ color:"#55556e", fontSize:12 }}>
                          {Array.isArray(w.category) ? w.category.join(", ") : w.category}
                        </div>
                      </div>
                      <button onClick={() => toggleWorkPublic(w.id, w.isPublic)}
                        style={{ padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:600, border:"none", cursor:"pointer",
                          background:w.isPublic?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                          color:w.isPublic?"#10b981":"#ef4444" }}>
                        {w.isPublic?"공개":"비공개"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
