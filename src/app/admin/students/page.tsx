"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Student { id:string; displayName:string; email:string; major:string; isActive:boolean; }

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db,"users"));
        const list = snap.docs
          .map((d) => ({ id:d.id, ...d.data() } as any))
          .filter((u:any) => u.role==="student")
          .sort((a:any,b:any) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
        setStudents(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleActive = async (id:string, current:boolean) => {
    await updateDoc(doc(db,"users",id), { isActive:!current });
    setStudents((p) => p.map((s) => s.id===id ? {...s,isActive:!current} : s));
  };

  const filtered = students.filter((s) =>
    !search.trim() || s.displayName?.includes(search) || s.email?.includes(search)
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>학생 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:24 }}>⚠ <strong style={{ color:"#9999bb" }}>활성화</strong>된 학생의 작품만 갤러리에 공개됩니다.</p>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 / 이메일 검색"
          style={{ width:"100%", maxWidth:400, background:"#111118", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, marginBottom:20, boxSizing:"border-box" }} />

        {loading ? <div style={{ textAlign:"center", padding:60, color:"#55556e" }}>⏳ 불러오는 중...</div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((s) => (
              <div key={s.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{s.displayName||"(이름 없음)"}</div>
                  <div style={{ color:"#9999bb", fontSize:13 }}>{s.email}</div>
                </div>
                <button onClick={() => toggleActive(s.id, s.isActive)}
                  style={{ padding:"8px 20px", borderRadius:999, fontWeight:700, fontSize:13, border:"none", cursor:"pointer",
                    background:s.isActive?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                    color:s.isActive?"#10b981":"#ef4444" }}>
                  {s.isActive?"✅ 활성화":"❌ 비활성화"}
                </button>
              </div>
            ))}
            {filtered.length===0 && <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>학생이 없습니다.</p>}
          </div>}
      </div>
      <Footer />
    </div>
  );
}
