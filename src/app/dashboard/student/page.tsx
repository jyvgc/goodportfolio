"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";

interface Work { id:string; title:string; category:string|string[]; images:string[]; viewCount:number; isPublic:boolean; }
export default function StudentDashboard() {
  const { firebaseUser, userDoc } = useAuthStore();
  const [works, setWorks] = useState<Work[]>([]);
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const q = query(collection(db,"works"), where("authorUid","==",firebaseUser.uid), orderBy("createdAt","desc"));
      const snap = await getDocs(q);
      setWorks(snap.docs.map((d) => ({ id:d.id, ...d.data() } as Work)));
    })();
  }, [firebaseUser]);
  const cat = (c:string|string[]) => Array.isArray(c) ? c.join(", ") : c;
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900 }}>내 대시보드</h1>
            <p style={{ color:"#9999bb", marginTop:4 }}>{(userDoc as any)?.name ?? ""} 님, 환영합니다!</p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <Link href="/dashboard/student/profile" style={{ border:"1px solid #3d3d52", color:"#9999bb", padding:"10px 20px", borderRadius:8, textDecoration:"none", fontWeight:600, fontSize:14 }}>프로필 편집</Link>
            <Link href="/dashboard/student/works/new" style={{ background:"#6366f1", color:"#fff", padding:"10px 24px", borderRadius:8, textDecoration:"none", fontWeight:600, fontSize:14 }}>+ 새 작품 업로드</Link>
          </div>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>내 작품 ({works.length})</h2>
        {works.length===0
          ? <div style={{ textAlign:"center", padding:"80px 0", color:"#55556e" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
              <p>아직 등록한 작품이 없습니다.</p>
              <Link href="/dashboard/student/works/new" style={{ color:"#6366f1", marginTop:12, display:"inline-block" }}>첫 작품 등록하기 →</Link>
            </div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {works.map((w) => (
                <Link key={w.id} href={`/work/${w.id}`} style={{ textDecoration:"none" }}>
                  <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:12, overflow:"hidden" }}>
                    <div style={{ aspectRatio:"1", background:"#1a1a24" }}>
                      {w.images?.[0] ? <img src={w.images[0]} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎨</div>}
                    </div>
                    <div style={{ padding:14 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#f0f0ff", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"rgba(99,102,241,0.15)", color:"#818cf8" }}>{cat(w.category)}</span>
                        <span style={{ fontSize:11, color:w.isPublic?"#10b981":"#55556e" }}>{w.isPublic?"공개":"비공개"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>}
      </div>
    </div>
  );
}
