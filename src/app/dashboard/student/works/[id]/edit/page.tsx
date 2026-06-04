"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIM = 1600;

async function uploadToCloudinary(file: File): Promise<string> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "goodportfolio_unsigned");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/djnztlzaq/image/upload`,
    { method: "POST", body: data }
  );
  const json = await res.json();
  if (!json.secure_url) throw new Error("업로드 실패: " + JSON.stringify(json));
  return json.secure_url as string;
}

function validateImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > MAX_BYTES) { resolve(`${file.name}: 2MB 초과`); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width > MAX_DIM || img.height > MAX_DIM
        ? `${file.name}: ${img.width}×${img.height}px → 1600×1600px 이하로 줄여주세요`
        : null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(`${file.name}: 읽을 수 없는 파일`); };
    img.src = url;
  });
}

export default function EditWorkPage() {
  const router = useRouter();
  const params = useParams();
  const workId = params.id as string;
  const { firebaseUser } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(["웹툰","게임아트","캐릭터","배경","UI/UX","3D"]);
  const [tools, setTools] = useState<string[]>(["Photoshop","Illustrator","Clip Studio","Procreate","Blender","Maya","Unity","Figma"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const [wSnap, sSnap] = await Promise.all([
          getDoc(doc(db, "works", workId)),
          getDoc(doc(db, "settings", "main")),
        ]);
        if (!wSnap.exists()) { router.push("/dashboard/student"); return; }
        const w = wSnap.data();
        // 본인 작품인지 확인
        if (w.authorUid !== firebaseUser.uid) { router.push("/dashboard/student"); return; }
        setTitle(w.title ?? "");
        setDescription(w.description ?? "");
        setSelectedCats(Array.isArray(w.category) ? w.category : [w.category]);
        setSelectedTools(w.tools ?? []);
        setIsPublic(w.isPublic ?? true);
        setExistingImages(w.images ?? []);
        if (sSnap.exists()) {
          if (sSnap.data().categories?.length) setCategories(sSnap.data().categories);
          if (sSnap.data().tools?.length) setTools(sSnap.data().tools);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [firebaseUser, workId]);

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleNewFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of picked) {
      const err = await validateImage(f);
      if (err) errs.push(err); else valid.push(f);
    }
    setErrors(errs);
    setNewFiles(valid);
    setNewPreviews(valid.map((f) => URL.createObjectURL(f)));
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages((p) => p.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!firebaseUser) return;
    if (!title.trim()) { setErrors(["제목을 입력하세요."]); return; }
    if (selectedCats.length === 0) { setErrors(["카테고리를 선택하세요."]); return; }
    setErrors([]);
    setSaving(true);
    try {
      // 새 이미지 업로드
      const newUrls = newFiles.length > 0
        ? await Promise.all(newFiles.map(uploadToCloudinary))
        : [];
      const allImages = [...existingImages, ...newUrls];

      await updateDoc(doc(db, "works", workId), {
        title: title.trim(),
        description: description.trim(),
        category: selectedCats,
        tools: selectedTools,
        images: allImages,
        isPublic,
        updatedAt: serverTimestamp(),
      });
      router.push("/dashboard/student");
    } catch(e: any) {
      console.error(e);
      setErrors(["저장 중 오류가 발생했습니다: " + (e?.message ?? "")]);
    } finally { setSaving(false); }
  };

  const chip = (label: string, active: boolean, onClick: () => void, color = "#6366f1") => (
    <button key={label} type="button" onClick={onClick}
      style={{ padding:"6px 16px", borderRadius:999, fontSize:13, fontWeight:600, cursor:"pointer",
        border: active ? "none" : "1px solid #3d3d52",
        background: active ? color : "#111118",
        color: active ? "#fff" : "#9999bb" }}>
      {label}
    </button>
  );

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", color:"#818cf8" }}>
      로딩 중...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:720, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ marginBottom:24 }}>
          <Link href="/dashboard/student" style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}>← 대시보드</Link>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>작품 수정</h1>

        {errors.length > 0 && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:8, padding:16, marginBottom:24 }}>
            {errors.map((e, i) => <p key={i} style={{ color:"#ef4444", fontSize:13, margin:"2px 0" }}>⚠ {e}</p>)}
          </div>
        )}

        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32, display:"flex", flexDirection:"column", gap:24 }}>
          {/* 제목 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
          </div>

          {/* 설명 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>작품 설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box" }} />
          </div>

          {/* 카테고리 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:8 }}>카테고리 * (여러 개 선택 가능)</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {categories.map((c) => chip(c, selectedCats.includes(c), () => setSelectedCats((p) => toggle(p, c))))}
            </div>
            {selectedCats.length > 0 && <p style={{ color:"#818cf8", fontSize:12, marginTop:8 }}>선택됨: {selectedCats.join(", ")}</p>}
          </div>

          {/* 사용 툴 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:8 }}>사용 툴</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {tools.map((t) => chip(t, selectedTools.includes(t), () => setSelectedTools((p) => toggle(p, t)), "#0ea5e9"))}
            </div>
          </div>

          {/* 기존 이미지 */}
          {existingImages.length > 0 && (
            <div>
              <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:8 }}>기존 이미지 (✕ 클릭하면 삭제)</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8 }}>
                {existingImages.map((url, i) => (
                  <div key={i} style={{ position:"relative", borderRadius:8, overflow:"hidden" }}>
                    <img src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                    <button onClick={() => removeExistingImage(i)}
                      style={{ position:"absolute", top:4, right:4, background:"rgba(239,68,68,0.9)", border:"none", borderRadius:"50%", width:24, height:24, color:"white", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새 이미지 추가 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>이미지 추가</label>
            <div style={{ background:"#1a1a24", border:"2px dashed #2e2e3f", borderRadius:8, padding:20, textAlign:"center" }}>
              <input type="file" multiple accept="image/*" onChange={handleNewFiles} id="new-file-input" style={{ display:"none" }} />
              <label htmlFor="new-file-input" style={{ cursor:"pointer" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>📁</div>
                <div style={{ color:"#6366f1", fontWeight:600, fontSize:14 }}>클릭하여 이미지 추가</div>
                <div style={{ color:"#55556e", fontSize:12, marginTop:6 }}>⚠ 최대 1600×1600px / 2MB 이내</div>
              </label>
            </div>
            {newPreviews.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8, marginTop:8 }}>
                {newPreviews.map((p, i) => <img key={i} src={p} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8 }} />)}
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <input type="checkbox" id="pub" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width:18, height:18, cursor:"pointer", accentColor:"#6366f1" }} />
            <label htmlFor="pub" style={{ color:"#9999bb", fontSize:14, cursor:"pointer" }}>갤러리에 공개</label>
          </div>

          <button onClick={save} disabled={saving}
            style={{ background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"14px 0", fontWeight:700, fontSize:16, cursor:saving?"not-allowed":"pointer" }}>
            {saving ? "저장 중... ⏳" : "수정 완료"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
