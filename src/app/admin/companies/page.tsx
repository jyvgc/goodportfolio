"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Company { id:string; displayName:string; email:string; companyName:string; isApproved:boolean; createdAt:any; }

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db,"users"));
        const list = snap.docs
          .map((d) => ({ id:d.id, ...d.data() } as any))
          .filter((u:any) => u.role==="company")
          .sort((a:any,b:any) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
        setCompanies(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleApprove = async (id:string, current:boolean) => {
    await updateDoc(doc(db,"users",id), { isApproved:!current });
    setCompanies((p) => p.map((c) => c.id===id ? {...c,isApproved:!current} : c));
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>기업 승인 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:28 }}>승인된 기업만 채용 제안을 보낼 수 있습니다.</p>

        {loading ? <div style={{ textAlign:"center", padding:60, color:"#55556e" }}>⏳ 불러오는 중...</div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {companies.map((c) => (
              <div key={c.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{c.companyName || c.displayName || "(회사명 없음)"}</div>
                  <div style={{ color:"#9999bb", fontSize:13 }}>{c.email}</div>
                </div>
                <button onClick={() => toggleApprove(c.id, c.isApproved)}
                  style={{ padding:"8px 20px", borderRadius:999, fontWeight:700, fontSize:13, border:"none", cursor:"pointer",
                    background:c.isApproved?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",
                    color:c.isApproved?"#10b981":"#ef4444" }}>
                  {c.isApproved?"✅ 승인됨":"❌ 미승인"}
                </button>
              </div>
            ))}
            {companies.length===0 && <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>기업 회원이 없습니다.</p>}
          </div>}
      </div>
      <Footer />
    </div>
  );
}
