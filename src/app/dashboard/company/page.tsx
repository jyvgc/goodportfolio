"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";

interface Offer { id:string; studentName:string; studentEmail:string; message:string; status:"pending"|"approved"|"rejected"; createdAt:any; }
const statusLabel = (s: Offer["status"]) => ({
  pending:  { label:"관리자 검토 중", color:"#818cf8", bg:"rgba(99,102,241,0.15)" },
  approved: { label:"관리자 승인",   color:"#10b981", bg:"rgba(16,185,129,0.15)" },
  rejected: { label:"반려됨",        color:"#ef4444", bg:"rgba(239,68,68,0.15)"  },
}[s]);

export default function CompanyDashboard() {
  const { firebaseUser, userDoc } = useAuthStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const q = query(collection(db, "offers"), where("companyUid","==",firebaseUser.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id:d.id, ...d.data() } as Offer))
        .sort((a,b) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
      setOffers(list);
    })();
  }, [firebaseUser]);
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, flexWrap:"wrap", gap:16 }}>
          <h1 style={{ fontSize:28, fontWeight:900 }}>기업 대시보드</h1>
          <Link href="/dashboard/company/profile" style={{ background:"#6366f1", color:"#fff", padding:"10px 24px", borderRadius:8, textDecoration:"none", fontWeight:600, fontSize:14 }}>회사 정보 수정</Link>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>내가 보낸 채용 제안</h2>
        {offers.length===0 ? <p style={{ color:"#55556e" }}>아직 보낸 채용 제안이 없습니다.</p>
          : offers.map((o) => { const s = statusLabel(o.status); return (
            <div key={o.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, padding:20, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{o.studentName}</div>
                  <div style={{ color:"#9999bb", fontSize:13 }}>{o.studentEmail}</div>
                  <div style={{ color:"#ccccdd", fontSize:14, marginTop:6 }}>💬 {o.message}</div>
                </div>
                <span style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:700, background:s.bg, color:s.color }}>{s.label}</span>
              </div>
            </div>
          ); })}
      </div>
    </div>
  );
}
