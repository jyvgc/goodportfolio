"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Offer {
  id: string; companyName: string; companyEmail: string;
  companyPhone?: string; companyBusiness?: string; companyWebsite?: string;
  studentName: string; studentEmail: string; message: string;
  status: "pending" | "approved" | "rejected"; createdAt: any;
}
export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer)));
    })();
  }, []);
  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await updateDoc(doc(db, "offers", id), { status });
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };
  const fmt = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("ko-KR", { year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit" });
  };
  const badge = (s: Offer["status"]) => ({ pending:{bg:"rgba(99,102,241,0.15)",color:"#818cf8",label:"⏳ 검토 중"}, approved:{bg:"rgba(16,185,129,0.15)",color:"#10b981",label:"✅ 승인됨"}, rejected:{bg:"rgba(239,68,68,0.15)",color:"#ef4444",label:"❌ 거절됨"} }[s]);
  return (
    <div style={{ padding:32, color:"#f0f0ff", background:"#0a0a0f", minHeight:"100vh" }}>
      <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>채용 제안 관리</h1>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {offers.length===0 && <p style={{ color:"#55556e", textAlign:"center", padding:60 }}>채용 제안이 없습니다.</p>}
        {offers.map((o) => { const b = badge(o.status); return (
          <div key={o.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:17, color:"#f0f0ff", marginBottom:6 }}>{o.companyName}</div>
                <div style={{ color:"#9999bb", fontSize:13, lineHeight:1.8 }}>
                  📧 {o.companyEmail}<br />
                  {o.companyPhone && <>{`📞 ${o.companyPhone}`}<br /></>}
                  {o.companyBusiness && <>{`🏢 업종: ${o.companyBusiness}`}<br /></>}
                  {o.companyWebsite && <>{`🌐 ${o.companyWebsite}`}<br /></>}
                </div>
                <div style={{ marginTop:10, padding:"8px 12px", background:"#1a1a24", borderRadius:8, borderLeft:"3px solid #6366f1" }}>
                  <div style={{ color:"#818cf8", fontSize:12, marginBottom:4 }}>제안 대상 학생</div>
                  <div style={{ color:"#f0f0ff", fontSize:14 }}>{o.studentName} ({o.studentEmail})</div>
                </div>
                <div style={{ marginTop:10, color:"#ccccdd", fontSize:14, lineHeight:1.6 }}>💬 {o.message}</div>
                <div style={{ marginTop:8, color:"#55556e", fontSize:12 }}>🕐 제안일시: {fmt(o.createdAt)}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
                <span style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:b.bg, color:b.color }}>{b.label}</span>
                {o.status==="pending" && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => updateStatus(o.id,"approved")} style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:600 }}>승인</button>
                    <button onClick={() => updateStatus(o.id,"rejected")} style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:600 }}>거절</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ); })}
      </div>
    </div>
  );
}
