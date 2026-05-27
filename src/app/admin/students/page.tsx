"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Student { id:string; name:string; email:string; major:string; isActive:boolean; }
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    (async () => {
      const q = query(collection(db,"users"), orderBy("createdAt","desc"));
      const snap = await getDocs(q);
      setStudents(snap.docs.map((d) => ({id:d.id,...d.data()}as any)).filter((u:any) => u.role==="student"));
    })();
  }, []);
  const toggleActive = async (id:string, current:boolean) => {
    await updateDoc(doc(db,"users",id), { isActive:!current });
    setStudents((prev) => prev.map((s) => s.id===id ? {...s,isActive:!current} : s));
  };
  const filtered = students.filter((s) => s.name?.includes(search)||s.email?.includes(search)||s.major?.includes(search));
  return (
    <div style={{ padding:32, background:"#0a0a0f", color:"#f0f0ff", minHeight:"100vh" }}>
      <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>학생 관리</h1>
      <p style={{ color:"#55556e", fontSize:13, marginBottom:24 }}>⚠ <strong style={{ color:"#9999bb" }}>활성화</strong>된 학생의 작품만 갤러리에 공개됩니다.</p>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 / 이메일 / 학과 검색"
        style={{ width:"100%", maxWidth:400, background:"#111118", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, marginBottom:20, boxSizing:"border-box" }} />
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map((s) => (
          <div key={s.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>{s.name||"(이름 없음)"}</div>
              <div style={{ color:"#9999bb", fontSize:13 }}>{s.email}</div>
              {s.major && <div style={{ color:"#55556e", fontSize:12 }}>{s.major}</div>}
            </div>
            <button onClick={() => toggleActive(s.id,s.isActive)}
              style={{ padding:"8px 20px", borderRadius:999, fontWeight:700, fontSize:13, border:"none", cursor:"pointer",
                background:s.isActive?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)", color:s.isActive?"#10b981":"#ef4444" }}>
              {s.isActive?"✅ 활성화":"❌ 비활성화"}
            </button>
          </div>
        ))}
        {filtered.length===0 && <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>학생이 없습니다.</p>}
      </div>
    </div>
  );
}
