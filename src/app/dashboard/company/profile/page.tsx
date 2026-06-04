"use client";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const INDUSTRIES = ["웹툰 제작사","게임 회사","광고/마케팅","애니메이션","출판사","교육기관","IT/스타트업","기타"];
const COMPANY_SIZES = ["1~10명","11~30명","30명 이상"];

async function uploadToCloudinary(file: File): Promise<string> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "goodportfolio_unsigned");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/djnztlzaq/image/upload`,
    { method: "POST", body: data }
  );
  const json = await res.json();
  if (!json.secure_url) throw new Error("업로드 실패");
  return json.secure_url as string;
}

export default function CompanyProfilePage() {
  const { firebaseUser } = useAuthStore();
  const [form, setForm] = useState({
    companyName:"", industry:"", companySize:"",
    website:"", contactPerson:"", title:"", phone:"", description:"",
  });
  const [profileImage, setProfileImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const [uSnap, pSnap] = await Promise.all([
          getDoc(doc(db, "users", firebaseUser.uid)),
          getDoc(doc(db, "companyProfiles", firebaseUser.uid)),
        ]);
        if (uSnap.exists()) setProfileImage(uSnap.data().profileImage ?? "");
        if (pSnap.exists()) {
          const d = pSnap.data();
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      setImageError("프로필 이미지는 300KB 이하여야 합니다.");
      return;
    }
    setImageError("");
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      let finalImage = profileImage;
      if (imageFile) {
        finalImage = await uploadToCloudinary(imageFile);
        setProfileImage(finalImage);
        setPreviewImage("");
      }
      // users 컬렉션에 profileImage 저장
      await setDoc(doc(db, "users", firebaseUser.uid), {
        profileImage: finalImage,
        updatedAt: new Date(),
      }, { merge: true });
      // companyProfiles 컬렉션에 나머지 저장
      await setDoc(doc(db, "companyProfiles", firebaseUser.uid), {
        ...form, updatedAt: new Date(),
      }, { merge: true });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, textarea = false) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>{label}</label>
      {textarea
        ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({...p,[key]:e.target.value}))} rows={4}
            style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box" }} />
        : <input value={form[key]} onChange={(e) => setForm((p) => ({...p,[key]:e.target.value}))}
            style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ textAlign:"center", padding:"200px 0", color:"#55556e" }}>⏳ 불러오는 중...</div>
      <Footer />
    </div>
  );

  const displayImg = previewImage || profileImage;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:640, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ marginBottom:24 }}>
          <Link href="/dashboard/company" style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}>← 대시보드</Link>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>회사 정보 수정</h1>
        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32 }}>

          {/* 프로필 이미지 */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
            <div style={{ position:"relative", marginBottom:12 }}>
              <div style={{ width:96, height:96, borderRadius:"50%", overflow:"hidden", background:"linear-gradient(135deg,#22d3ee,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", border:"3px solid #2e2e3f" }}>
                {displayImg
                  ? <img src={displayImg} alt="프로필" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:36, fontWeight:900, color:"white" }}>🏢</span>}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"#6366f1", border:"2px solid #0a0a0f", color:"white", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                ✏️
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display:"none" }} />
            <button onClick={() => fileInputRef.current?.click()}
              style={{ background:"none", border:"1px solid #2e2e3f", borderRadius:8, color:"#9999bb", padding:"6px 16px", fontSize:13, cursor:"pointer" }}>
              로고 이미지 변경
            </button>
            <p style={{ color:"#55556e", fontSize:11, marginTop:6 }}>⚠ 최대 300KB 이하 이미지</p>
            {imageError && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ {imageError}</p>}
          </div>

          {field("회사명", "companyName")}

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>업종</label>
            <select value={form.industry} onChange={(e) => setForm((p) => ({...p,industry:e.target.value}))}
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14 }}>
              <option value="">선택</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>회사 규모</label>
            <select value={form.companySize} onChange={(e) => setForm((p) => ({...p,companySize:e.target.value}))}
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14 }}>
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
            style={{ width:"100%", background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"14px 0", fontWeight:700, fontSize:16, cursor:saving?"not-allowed":"pointer", marginTop:8 }}>
            {saving ? "저장 중..." : done ? "✅ 저장 완료!" : "저장하기"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
