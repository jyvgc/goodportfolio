"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";

export default function CompanyProfilePage() {
  const { firebaseUser } = useAuthStore();
  const [form, setForm] = useState({ companyName:"", representative:"", business:"", phone:"", website:"", address:"", description:"" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const snap = await getDoc(doc(db,"users",firebaseUser.uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({ companyName:d.companyName??"", representative:d.representative??"", business:d.business??"", phone:d.phone??"", website:d.website??"", address:d.address??"", description:d.description??"" });
      }
    })();
  }, [firebaseUser]);
  const save = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    await updateDoc(doc(db,"users",firebaseUser.uid), { ...form, updatedAt:new Date() });
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 3000);
  };
  const inp = (label:string, key:keyof typeof form, placeholder="", textarea=false) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>{label}</label>
      {textarea
        ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({...p,[key]:e.target.value}))} rows={4} placeholder={placeholder}
            style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box" }} />
        : <input value={form[key]} onChange={(e) => setForm((p) => ({...p,[key]:e.target.value}))} placeholder={placeholder}
            style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />}
    </div>
  );
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:640, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>회사 정보 수정</h1>
        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32 }}>
          {inp("회사명 *","companyName","회사명을 입력하세요")}
          {inp("대표자명","representative","대표자명")}
          {inp("업종","business","예: IT / 게임 / 출판 / 광고")}
          {inp("연락처","phone","010-0000-0000")}
          {inp("웹사이트","website","https://company.com")}
          {inp("주소","address","회사 주소")}
          {inp("회사 소개","description","회사를 간략하게 소개해주세요",true)}
          <button onClick={save} disabled={saving}
            style={{ width:"100%", background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"14px 0", fontWeight:700, fontSize:16, cursor:saving?"not-allowed":"pointer", marginTop:8 }}>
            {saving?"저장 중...":done?"✅ 저장 완료!":"저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
