"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const INDUSTRIES = ["웹툰 제작사","게임 회사","광고/마케팅","애니메이션","출판사","교육기관","IT/스타트업","기타"];
const COMPANY_SIZES = ["1~10명","11~30명","30명 이상"];

export default function CompanyProfilePage() {
  const { firebaseUser } = useAuthStore();
  const [form, setForm] = useState({
    companyName: "", industry: "", companySize: "",
    website: "", contactPerson: "", title: "", phone: "", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        // companyProfiles 컬렉션에서 읽기 (회원가입 때 저장되는 곳)
        const snap = await getDoc(doc(db, "companyProfiles", firebaseUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            companyName:   d.companyName   ?? "",
            industry:      d.industry      ?? "",
            companySize:   d.companySize   ?? "",
            website:       d.website       ?? "",
            contactPerson: d.contactPerson ?? "",
            title:         d.title         ?? "",
            phone:         d.phone         ?? "",
            description:   d.description   ?? "",
          });
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [firebaseUser]);

  const save = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "companyProfiles", firebaseUser.uid), {
        ...form, updatedAt: new Date(),
      }, { merge: true });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, textarea = false) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 6 }}>{label}</label>
      {textarea
        ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} rows={4}
            style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
        : <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }} />}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "200px 0", color: "#55556e" }}>⏳ 불러오는 중...</div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "100px 24px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>회사 정보 수정</h1>
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 32 }}>
          {field("회사명", "companyName")}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 6 }}>업종</label>
            <select value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
              style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14 }}>
              <option value="">선택</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 6 }}>회사 규모</label>
            <select value={form.companySize} onChange={(e) => setForm((p) => ({ ...p, companySize: e.target.value }))}
              style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14 }}>
              <option value="">선택</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {field("회사 홈페이지", "website")}
          {field("담당자 이름", "contactPerson")}
          {field("직함", "title")}
          {field("전화", "phone")}
          {field("회사 소개", "description", true)}

          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#3d3d52" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "14px 0", fontWeight: 700, fontSize: 16, cursor: saving ? "not-allowed" : "pointer", marginTop: 8 }}>
            {saving ? "저장 중..." : done ? "✅ 저장 완료!" : "저장하기"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
