"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";

const DEFAULT_CATEGORIES = ["웹툰","게임아트","캐릭터","배경","UI/UX","3D"];
const DEFAULT_TOOLS = ["Photoshop","Illustrator","Clip Studio","Procreate","Blender","Maya","Unity","Figma"];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_DIM = 1600;

async function uploadToCloudinary(file: File): Promise<string> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: data }
  );
  const json = await res.json();
  if (!json.secure_url) throw new Error("Cloudinary upload failed: " + JSON.stringify(json));
  return json.secure_url as string;
}

function validateImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > MAX_BYTES) { resolve(`${file.name}: 파일 크기가 2MB를 초과합니다.`); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > MAX_DIM || img.height > MAX_DIM)
        resolve(`${file.name}: 이미지 크기 ${img.width}×${img.height}px → ${MAX_DIM}×${MAX_DIM}px 이하로 줄여주세요.`);
      else resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(`${file.name}: 이미지를 읽을 수 없습니다.`); };
    img.src = url;
  });
}

export default function NewWorkPage() {
  const router = useRouter();
  const { firebaseUser, userDoc } = useAuthStore();
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [tools, setTools] = useState<string[]>(DEFAULT_TOOLS);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db,"settings","main"));
        if (snap.exists()) {
          const d = snap.data();
          if (d.categories?.length) setCategories(d.categories);
          if (d.tools?.length) setTools(d.tools);
        }
      } catch(e) { console.error(e); }
    })();
  }, []);

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of picked) {
      const err = await validateImage(f);
      if (err) errs.push(err);
      else valid.push(f);
    }
    setErrors(errs);
    setImageFiles(valid);
    setPreviews(valid.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!firebaseUser || !userDoc) { setErrors(["로그인이 필요합니다."]); return; }
    if (!title.trim()) { setErrors(["제목을 입력하세요."]); return; }
    if (selectedCats.length === 0) { setErrors(["카테고리를 하나 이상 선택하세요."]); return; }
    setErrors([]);
    setUploading(true);
    try {
      const urls = imageFiles.length > 0 ? await Promise.all(imageFiles.map(uploadToCloudinary)) : [];
      await addDoc(collection(db,"works"), {
        title: title.trim(),
        description: description.trim(),
        category: selectedCats,
        tools: selectedTools,
        images: urls,
        authorUid: firebaseUser.uid,
        authorName: userDoc.displayName ?? "",
        isPublic,
        isFeatured: false,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      router.push("/dashboard/student");
    } catch (e: any) {
      console.error("upload error:", e);
      setErrors(["업로드 중 오류가 발생했습니다: " + (e?.message ?? "")]);
    } finally {
      setUploading(false);
    }
  };

  const chip = (label: string, active: boolean, onClick: () => void, color = "#6366f1") => (
    <button key={label} onClick={onClick}
      style={{ padding:"6px 16px", borderRadius:999, fontSize:13, fontWeight:600, cursor:"pointer",
        border: active ? "none" : "1px solid #3d3d52",
        background: active ? color : "#111118",
        color: active ? "#fff" : "#9999bb" }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:720, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>새 작품 업로드</h1>

        {errors.length > 0 && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:8, padding:16, marginBottom:24 }}>
            {errors.map((e, i) => <p key={i} style={{ color:"#ef4444", fontSize:13, margin:"2px 0" }}>⚠ {e}</p>)}
          </div>
        )}

        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32, display:"flex", flexDirection:"column", gap:24 }}>
          {/* 제목 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="작품 제목"
              style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
          </div>

          {/* 설명 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>작품 설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="작품을 소개해주세요"
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
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:8 }}>사용 툴 (여러 개 선택 가능)</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {tools.map((t) => chip(t, selectedTools.includes(t), () => setSelectedTools((p) => toggle(p, t)), "#0ea5e9"))}
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label style={{ color:"#9999bb", fontSize:13, display:"block", marginBottom:6 }}>이미지 업로드</label>
            <div style={{ background:"#1a1a24", border:"2px dashed #2e2e3f", borderRadius:8, padding:24, textAlign:"center" }}>
              <input type="file" multiple accept="image/*" onChange={handleFiles} id="file-input" style={{ display:"none" }} />
              <label htmlFor="file-input" style={{ cursor:"pointer" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
                <div style={{ color:"#6366f1", fontWeight:600, fontSize:14 }}>클릭하여 이미지 선택</div>
                <div style={{ color:"#55556e", fontSize:12, marginTop:8 }}>
                  ⚠ 최대 <strong style={{ color:"#9999bb" }}>1600×1600px</strong> 이내,
                  <strong style={{ color:"#9999bb" }}> 2MB</strong> 이내 파일만 가능
                </div>
              </label>
            </div>
            {previews.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8, marginTop:12 }}>
                {previews.map((p, i) => <img key={i} src={p} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8 }} />)}
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <input type="checkbox" id="pub" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width:18, height:18, cursor:"pointer", accentColor:"#6366f1" }} />
            <label htmlFor="pub" style={{ color:"#9999bb", fontSize:14, cursor:"pointer" }}>갤러리에 공개</label>
          </div>

          <button onClick={submit} disabled={uploading}
            style={{ background:uploading?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8,
              padding:"14px 0", fontWeight:700, fontSize:16, cursor:uploading?"not-allowed":"pointer" }}>
            {uploading ? "업로드 중... ⏳" : "작품 등록"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
