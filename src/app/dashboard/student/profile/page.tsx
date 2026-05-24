"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getStudentProfile, upsertStudentProfile } from "@/lib/firestore";
import { SKILL_OPTIONS, DEPARTMENT_OPTIONS } from "@/lib/utils";
import { uploadImage } from "@/lib/cloudinary";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      department: "웹툰스쿨",
      graduationYear: 2026,
      bio: "",
      isPublic: true,
      instagram: "",
      artstation: "",
      youtube: "",
    },
  });

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (firebaseUser) {
      // 현재 프로필 이미지
      setProfileImage(firebaseUser.photoURL || userDoc?.profileImage || "");

      getStudentProfile(firebaseUser.uid).then((profile) => {
        if (profile) {
          reset({
            department: profile.department,
            graduationYear: profile.graduationYear,
            bio: profile.bio,
            isPublic: profile.isPublic,
            instagram: profile.snsLinks?.instagram || "",
            artstation: profile.snsLinks?.artstation || "",
            youtube: profile.snsLinks?.youtube || "",
          });
          setSelectedSkills(profile.skills || []);
        }
      });
    }
  }, [firebaseUser, loading, router, reset, userDoc]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    try {
      setUploadingImage(true);
      toast.loading("이미지 업로드 중...", { id: "img" });
      const url = await uploadImage(file, `profiles/${firebaseUser.uid}`);
      setProfileImage(url);
      // Firebase Auth 프로필 업데이트
      await updateProfile(auth.currentUser!, { photoURL: url });
      // Firestore users 업데이트
      await updateDoc(doc(db, "users", firebaseUser.uid), { profileImage: url });
      toast.success("프로필 사진이 변경되었습니다!", { id: "img" });
    } catch {
      toast.error("이미지 업로드에 실패했습니다.", { id: "img" });
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );

  const onSubmit = async (data: any) => {
    if (!firebaseUser) return;
    try {
      setSaving(true);
      await upsertStudentProfile(firebaseUser.uid, {
        uid: firebaseUser.uid,
        department: data.department,
        grade: 3,
        graduationYear: Number(data.graduationYear),
        bio: data.bio,
        skills: selectedSkills,
        isPublic: data.isPublic,
        snsLinks: {
          instagram: data.instagram,
          artstation: data.artstation,
          youtube: data.youtube,
        },
        viewCount: 0,
        badges: [],
      });
      toast.success("프로필이 저장되었습니다!");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 이름 기반 아바타 색상
  const getAvatarColor = (name: string) => {
    const colors = [
      "linear-gradient(135deg, #6366f1, #22d3ee)",
      "linear-gradient(135deg, #f59e0b, #ef4444)",
      "linear-gradient(135deg, #10b981, #22d3ee)",
      "linear-gradient(135deg, #a855f7, #6366f1)",
      "linear-gradient(135deg, #f97316, #f59e0b)",
    ];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f",
    color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/student" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 대시보드</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>프로필 편집</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>프로필 편집</h1>

        {/* 프로필 이미지 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>프로필 사진</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* 이미지 미리보기 */}
            <div
              onClick={handleImageClick}
              style={{ position: "relative", width: 100, height: 100, borderRadius: 20, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
              {profileImage ? (
                <img src={profileImage} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: getAvatarColor(userDoc?.displayName || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: "white" }}>
                  {userDoc?.displayName?.charAt(0) || "?"}
                </div>
              )}
              {/* 호버 오버레이 */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "0"}>
                <span style={{ color: "white", fontSize: 24 }}>📷</span>
              </div>
            </div>

            <div>
              <p style={{ color: "#9999bb", fontSize: 14, marginBottom: 12 }}>
                프로필 사진을 클릭하여 변경하세요
              </p>
              <p style={{ color: "#55556e", fontSize: 12, marginBottom: 16 }}>
                JPG, PNG, WebP 지원 · 최대 5MB
              </p>
              <button
                onClick={handleImageClick}
                disabled={uploadingImage}
                style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#9999bb", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: uploadingImage ? 0.6 : 1 }}>
                {uploadingImage ? "업로드 중..." : "📷 사진 변경"}
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 기본 정보 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>기본 정보</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>학과</label>
                <select {...register("department")} style={inputStyle}>
                  {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>졸업 예정 연도</label>
                <select {...register("graduationYear")} style={inputStyle}>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>자기소개</label>
              <textarea {...register("bio")} rows={4} style={{ ...inputStyle, resize: "none" }} />
            </div>
          </div>

          {/* 기술 스택 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9999bb", textTransform: "uppercase", letterSpacing: "0.1em" }}>기술 스택</h2>
              {selectedSkills.length > 0 && (
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                  {selectedSkills.length}개 선택됨
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILL_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                  padding: "6px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                  background: selectedSkills.includes(s) ? "rgba(99,102,241,0.2)" : "#0a0a0f",
                  color: selectedSkills.includes(s) ? "#818cf8" : "#9999bb",
                  border: selectedSkills.includes(s) ? "1px solid rgba(99,102,241,0.5)" : "1px solid #2e2e3f",
                  fontWeight: selectedSkills.includes(s) ? 600 : 400,
                }}>{selectedSkills.includes(s) ? "✓ " : ""}{s}</button>
              ))}
            </div>
          </div>

          {/* SNS 링크 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>SNS 링크</h2>
            {[
              { name: "instagram", label: "Instagram", icon: "📷" },
              { name: "artstation", label: "ArtStation", icon: "🎨" },
              { name: "youtube", label: "YouTube", icon: "📺" },
            ].map((sns) => (
              <div key={sns.name} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>{sns.icon} {sns.label}</label>
                <input {...register(sns.name as any)} style={inputStyle} />
              </div>
            ))}
          </div>

          {/* 공개 설정 */}
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <input {...register("isPublic")} type="checkbox" style={{ width: 18, height: 18, accentColor: "#6366f1" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>포트폴리오 공개</div>
                <div style={{ color: "#55556e", fontSize: 13, marginTop: 2 }}>체크 해제 시 본인만 볼 수 있습니다</div>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white",
            padding: "14px", borderRadius: 10, fontSize: 16, fontWeight: 700,
            cursor: "pointer", border: "none", opacity: saving ? 0.6 : 1,
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}>
            {saving ? "저장 중..." : "프로필 저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
