"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Offer {
  id: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyBusiness?: string;
  companyWebsite?: string;
  studentName?: string;
  studentEmail?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "offers"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Offer))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setOffers(list);
      } catch (e) {
        console.error("offers fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "offers", id), { status });
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      console.error("status update error:", e);
    }
  };

  const fmt = (ts: any) => {
    if (!ts) return "-";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
    } catch { return "-"; }
  };

  const statusStyle = (s: string) => {
    if (s === "approved") return { bg:"rgba(16,185,129,0.15)", color:"#10b981", label:"✅ 승인됨" };
    if (s === "rejected") return { bg:"rgba(239,68,68,0.15)",  color:"#ef4444", label:"❌ 거절됨" };
    return { bg:"rgba(99,102,241,0.15)", color:"#818cf8", label:"⏳ 검토 중" };
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>채용 제안 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:28 }}>전체 {offers.length}건</p>

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : offers.length === 0 ? (
          <p style={{ color:"#55556e", textAlign:"center", padding:60 }}>채용 제안이 없습니다.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {offers.map((o) => {
              const s = statusStyle(o.status);
              return (
                <div key={o.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, padding:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:17, color:"#f0f0ff", marginBottom:6 }}>
                        {o.companyName || "(회사명 없음)"}
                      </div>
                      <div style={{ color:"#9999bb", fontSize:13, lineHeight:1.9 }}>
                        {o.companyEmail && <div>📧 {o.companyEmail}</div>}
                        {o.companyPhone && <div>📞 {o.companyPhone}</div>}
                        {o.companyBusiness && <div>🏢 {o.companyBusiness}</div>}
                        {o.companyWebsite && <div>🌐 {o.companyWebsite}</div>}
                      </div>
                      <div style={{ marginTop:10, padding:"10px 14px", background:"#1a1a24", borderRadius:8, borderLeft:"3px solid #6366f1" }}>
                        <div style={{ color:"#818cf8", fontSize:12, marginBottom:4 }}>제안 대상 학생</div>
                        <div style={{ color:"#f0f0ff", fontSize:14 }}>
                          {o.studentName || "(이름 없음)"} {o.studentEmail ? `(${o.studentEmail})` : ""}
                        </div>
                      </div>
                      {o.message && <div style={{ marginTop:10, color:"#ccccdd", fontSize:14, lineHeight:1.6 }}>💬 {o.message}</div>}
                      <div style={{ marginTop:8, color:"#55556e", fontSize:12 }}>🕐 {fmt(o.createdAt)}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
                      <span style={{ padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:s.bg, color:s.color }}>
                        {s.label}
                      </span>
                      {o.status === "pending" && (
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => updateStatus(o.id, "approved")}
                            style={{ background:"#10b981", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:600 }}>
                            승인
                          </button>
                          <button onClick={() => updateStatus(o.id, "rejected")}
                            style={{ background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:600 }}>
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
