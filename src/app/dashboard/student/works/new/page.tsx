"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { createWork } from "@/lib/firestore";
import { uploadImage } from "@/lib/cloudinary";
import { SKILL_OPTIONS, CATEGORY_OPTIONS } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Work } from "@/types";

const schema = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  category: z.string().min(1),
  description: z.string().max(1000),
  videoUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function NewWorkPage() {
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([...CATEGORY_OPTIONS]);

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      if (!snap.empty) {
        const cats = snap.docs.map((d) => d.data().name as string).filter(Boolean);
        if (cats.length > 0) setCategories(cats);
      }
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPublic: true, isFeatured: false, category: CATEGORY_OPTIONS[0] },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] },
    maxFiles: 10,
    onDrop: (files) => {
      setImages((prev) => [...prev, ...files]);
      setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    },
  });

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!firebaseUser) return;
    if (images.length === 0) { toast.error("이미지를 1개 이상 업로드하세요."); return; }
    try {
      setUploading(true);
      toast.loading("업로드 중...", { id: "upload" });
      const uploadedUrls = await Promise.all(
        images.map((f) => uploadImage(f, `works/${firebaseUser.uid}`))
      );
      await createWork({
        authorUid: firebaseUser.uid,
        title: data.title,
        category: data.category as Work["category"],
        description: data.description,
        images: uploadedUrls,
        videoUrl: data.videoUrl || undefined,
        tools: selectedSkills,
        isFeatured: data.isFeatured,
        isPublic: data.isPublic,
        order: Date.now(),
      });
      toast.success("작품이 등록되었습니다!", { id: "upload" });
      router.push("/dashboard/student");
    } catch {
      toast.error("업로드에 실패했습니다.", { id: "upload" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* 상단 바 */}
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "0 24px", height: 60, display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/student" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 대시보드</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>새 작품 업로드</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>새 작품 업로드</h1>
        <p style={{ color: "#55556e", fontSize: 13, marginBottom: 28 }}>작품 이미지와 정보를 입력해 주세요</p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 이미지 업로드 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <label style={{ fontWeight: 700, fontSize: 14 }}>이미지 <span style={{ color: "#6366f1" }}>*</span></label>
              <span style={{ color: "#55556e", fontSize: 12 }}>{images.length}/10장</span>
            </div>
            <div {...getRootProps()} style={{
              border: `2px dashed ${isDragActive ? "#6366f1" : "#2e2e3f"}`,
              borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: "pointer",
              background: isDragActive ? "rgba(99,102,241,0.05)" : "#0a0a0f",
              transition: "all 0.2s", marginBottom: previews.length > 0 ? 16 : 0,
            }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
              <p style={{ color: "#9999bb", fontSize: 14, marginBottom: 4 }}>
                {isDragActive ? "이미지를 놓으세요!" : "클릭하거나 이미지를 드래그하세요"}
              </p>
              <p style={{ color: "#2e2e3f", fontSize: 12 }}>JPG, PNG, GIF, WebP · 최대 10장</p>
            </div>

            {previews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => removeImage(i)} style={{
                      position: "absolute", top: 4, right: 4, width: 20, height: 20,
                      borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "white",
                      border: "none", cursor: "pointer", fontSize: 10, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                    {i === 0 && (
                      <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(99,102,241,0.9)", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>대표</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>기본 정보</h3>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>제목 *</label>
              <input {...register("title")} placeholder="작품 제목을 입력하세요" style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "11px 14px", borderRadius: 8, fontSize: 14, outline: "none" }} />
              {errors.title && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{errors.title.message}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>카테고리</label>
              <select {...register("category")} style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "11px 14px", borderRadius: 8, fontSize: 14, outline: "none" }}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>작품 설명</label>
              <textarea {...register("description")} rows={4} placeholder="작품에 대한 설명, 제작 과정 등을 적어주세요" style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "11px 14px", borderRadius: 8, fontSize: 14, outline: "none", resize: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#9999bb", marginBottom: 6 }}>영상 URL <span style={{ color: "#2e2e3f" }}>(선택)</span></label>
              <input {...register("videoUrl")} placeholder="https://youtube.com/..." style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "11px 14px", borderRadius: 8, fontSize: 14, outline: "none" }} />
            </div>
          </div>

          {/* 사용 툴 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>사용 툴</h3>
              {selectedSkills.length > 0 && (
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                  {selectedSkills.length}개 선택됨
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILL_OPTIONS.map((s) => {
                const selected = selectedSkills.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                    fontWeight: selected ? 700 : 400,
                    background: selected ? "rgba(99,102,241,0.25)" : "#0a0a0f",
                    color: selected ? "#a5b4fc" : "#9999bb",
                    border: selected ? "1.5px solid #6366f1" : "1px solid #2e2e3f",
                    transform: selected ? "scale(1.05)" : "scale(1)",
                    boxShadow: selected ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {selected && <span style={{ fontSize: 11 }}>✓</span>}
                    {s}
                  </button>
                );
              })}
            </div>
            {selectedSkills.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: "#0a0a0f", borderRadius: 8, border: "1px solid #1a1a24" }}>
                <p style={{ fontSize: 11, color: "#55556e", marginBottom: 8 }}>선택된 툴:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedSkills.map((s) => (
                    <span key={s} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                      {s}
                      <button type="button" onClick={() => toggleSkill(s)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>공개 설정</h3>
            {[
              { name: "isPublic", label: "포트폴리오 공개", desc: "체크 해제 시 본인만 볼 수 있습니다" },
              { name: "isFeatured", label: "대표작으로 설정", desc: "프로필 상단에 먼저 표시됩니다" },
            ].map((opt) => (
              <label key={opt.name} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", marginBottom: 12 }}>
                <input {...register(opt.name as any)} type="checkbox" style={{ width: 18, height: 18, accentColor: "#6366f1" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                  <div style={{ color: "#55556e", fontSize: 12 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button type="submit" disabled={uploading} style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "white", padding: "14px", borderRadius: 10,
            fontSize: 16, fontWeight: 700, cursor: "pointer", border: "none",
            opacity: uploading ? 0.6 : 1,
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}>
            {uploading ? "⏳ 업로드 중..." : "🎨 작품 등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
