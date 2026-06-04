"use client";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

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

export default function StudentProfilePage() {
  const { firebaseUser, userDoc, setUserDoc } = useAuthStore();
  const [form, setForm] = useState({
    displayName: "", bio: "", department: "", graduationStatus: "",
    instagram: "", twitter: "", behance: "", github: "",
  });
  const [profileImage, setProfileImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [snsEnabled, setSnsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const [uSnap, pSnap, sSnap] = await Promise.all([
          getDoc(doc(db, "users", firebaseUser.uid)),
          getDoc(doc(db, "studentProfiles", firebaseUser.uid)),
          getDoc(doc(db, "settings", "main")),
        ]);
        const u = uSnap.exists() ? uSnap.data() : {};
        const p = pSnap.exists() ? pSnap.data() : {};
        setForm({
          displayName:     u.displayName     ?? "",
          bio:             p.bio             ?? "",
          department:      p.department      ?? "",
          graduationStatus: p.grade === 0 ? "졸업생" : "졸업예정",
          instagram:       p.snsLinks?.instagram ?? "",
          twitter:         p.snsLinks?.twitter   ?? "",
          behance:         p.snsLinks?.behance    ?? "",
          github:          p.snsLinks?.github     ?? "",
        });
        setProfileImage(u.profileImage ?? "");
        if (sSnap.exists() && typeof sSnap.data().snsEnabled === "boolean") {
          setSnsEnabled(sSnap.data().snsEnabled);
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
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        displayName: form.displayName,
        profileImage: finalImage,
        updatedAt: new Date(),
      });
      await setDoc(doc(db, "studentProfiles", firebaseUser.uid), {
        bio: form.bio,
        department: form.department,
        grade: form.graduationStatus === "졸업생" ? 0 : 3,
        snsLinks: {
          instagram: form.instagram,
          twitter:   form.twitter,
          behance:   form.behance,
          github:    form.github,
        },
        updatedAt: new Date(),
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
        ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({...p,[key]:e.target.value}))} rows={3}
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
          <Link href="/dashboard/student" style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}>← 대시보드</Link>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>프로필 편집</h1>
        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32 }}>

          {/* 프로필 이미지 */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
            <div style={{ position:"relative", marginBottom:12 }}>
              <div style={{ width:96, height:96, borderRadius:"50%", overflow:"hidden", background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", border:"3px solid #2e2e3f" }}>
                {displayImg
                  ? <img src={displayImg} alt="프로필" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:36, fontWeight:900, color:"white" }}>{form.displayName?.charAt(0)||"?"}</span>}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"#6366f1", border:"2px solid #0a0a0f", color:"white", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
                ✏️
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display:"none" }} />
            <button onClick={() => fileInputRef.current?.click()}
              style={{ background:"none", border:"1px solid #2e2e3f", borderRadius:8, color:"#9999bb", padding:"6px 16px", fontSize:13, cursor:"pointer" }}>
              프로필 이미지 변경
            </button>
            <p style={{ color:"#55556e", fontSize:11, marginTop:6 }}>⚠ 최대 300KB 이하 이미지</p>
            {imageError && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ {imageError}</p>}
          </div>

          {field("이름", "displayName")}
          {field("자기소개", "bio", true)}

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:8 }}>학과</label>
            <div style={{ display:"flex", gap:8 }}>
              {["웹툰스쿨","비주얼게임컨텐츠스쿨"].map((d) => (
                <button key={d} type="button" onClick={() => setForm((p) => ({...p, department:d}))}
                  style={{ flex:1, padding:"10px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13,
                    border: form.department===d ? "2px solid #6366f1" : "1px solid #2e2e3f",
                    background: form.department===d ? "rgba(99,102,241,0.15)" : "#1a1a24",
                    color: form.department===d ? "#818cf8" : "#9999bb" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:8 }}>졸업 상태</label>
            <div style={{ display:"flex", gap:8 }}>
              {["졸업예정","졸업생"].map((s) => (
                <button key={s} type="button" onClick={() => setForm((p) => ({...p, graduationStatus:s}))}
                  style={{ flex:1, padding:"10px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13,
                    border: form.graduationStatus===s ? "2px solid #6366f1" : "1px solid #2e2e3f",
                    background: form.graduationStatus===s ? "rgba(99,102,241,0.15)" : "#1a1a24",
                    color: form.graduationStatus===s ? "#818cf8" : "#9999bb" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {snsEnabled && (
            <div style={{ marginTop:24, paddingTop:24, borderTop:"1px solid #2e2e3f" }}>
              <h3 style={{ color:"#818cf8", fontSize:14, fontWeight:600, marginBottom:16 }}>🔗 SNS 링크</h3>
              {field("Instagram", "instagram")}
              {field("Twitter / X", "twitter")}
              {field("Behance", "behance")}
              {field("GitHub", "github")}
            </div>
          )}

          <button onClick={save} disabled={saving}
            style={{ width:"100%", background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"14px 0", fontWeight:700, fontSize:16, cursor:saving?"not-allowed":"pointer", marginTop:24 }}>
            {saving ? "저장 중..." : done ? "✅ 저장 완료!" : "저장하기"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
