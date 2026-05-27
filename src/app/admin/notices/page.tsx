"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Notice { id:string; title:string; content:string; createdAt:any; }

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db,"notices"));
        const list = snap.docs
          .map((d) => ({ id:d.id, ...d.data() } as Notice))
          .sort((a:any,b:any) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0));
        setNotices(list);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const add = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const ref = await addDoc(collection(db,"notices"), { title, content, createdAt:serverTimestamp() });
      setNotices((p) => [{ id:ref.id, title, content, createdAt:null }, ...p]);
      setTitle(""); setContent("");
    } finally { setSaving(false); }
  };

  const remove = async (id:string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteDoc(doc(db,"notices",id));
    setNotices((p) => p.filter((n) => n.id!==id));
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:800, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>공지사항 관리</h1>

        {/* 작성 폼 */}
        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:28, marginBottom:32 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:"#818cf8", marginBottom:20 }}>새 공지 작성</h2>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목"
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="공지 내용"
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box" }} />
          </div>
          <button onClick={add} disabled={saving||!title.trim()}
            style={{ background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"10px 28px", fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
            {saving?"저장 중...":"공지 등록"}
          </button>
        </div>

        {/* 목록 */}
        {loading ? <div style={{ textAlign:"center", padding:40, color:"#55556e" }}>⏳ 불러오는 중...</div>
        : notices.length===0 ? <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>등록된 공지사항이 없습니다.</p>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {notices.map((n) => (
              <div key={n.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{n.title}</div>
                  {n.content && <p style={{ color:"#9999bb", fontSize:13, margin:0 }}>{n.content}</p>}
                </div>
                <button onClick={() => remove(n.id)}
                  style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"none", borderRadius:8, padding:"6px 16px", cursor:"pointer", fontWeight:600, flexShrink:0 }}>삭제</button>
              </div>
            ))}
          </div>}
      </div>
      <Footer />
    </div>
  );
}
