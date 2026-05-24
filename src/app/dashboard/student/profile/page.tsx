"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getStudentProfile, upsertStudentProfile } from "@/lib/firestore";
import { SKILL_OPTIONS, DEPARTMENT_OPTIONS } from "@/lib/utils";
import { uploadImage } from "@/lib/cloudinary";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요"),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "새 비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { department: "웹툰스쿨", graduationYear: 2026, bio: "", isPublic: true, instagram: "", artstation: "", youtube: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!loading && !firebaseUser) { router.push("/login"); return; }
    if (firebaseUser) {
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

    // 300KB 제한
    if (file.size > 300 * 1024) {
      toast.error("이미지 크기는 300KB 이하여야 합니다.");
      return;
    }

    try {
      setUploadingImage(true);
      toast.loading("이미지 업로드 중...", { id: "img" });
      const url = await uploadImage(file, `profiles/${firebaseUser.uid}`);
      setProfileImage(url);
      await updateProfile(auth.currentUser!, { photoURL: url });
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
        snsLinks: { instagram: data.instagram, artstation: data.artstation, youtube: data.youtube },
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

  // 비밀번호 변경
  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!firebaseUser || !firebaseUser.email) return;
    try {
      setChangingPassword(true);
      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      // 새 비밀번호로 변경
      await updatePassword(firebaseUser, data.newPassword);
      toast.success("비밀번호가 변경되었습니다!");
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (e: any) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        toast.error("현재 비밀번호가 올바르지 않습니다.");
      } else {
        toast.error("비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ["linear-gradient(135deg, #6366f1, #22d3ee)", "linear-gradient(135deg, #f59e0b, #ef4444)", "linear-gradient(135deg, #10b981, #22d3ee)", "linear-gradient(135deg, #a855f7, #6366f1)", "linear-gradient(135deg, #f97316, #f59e0b)"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  const inputStyle: React.CSSProperties = { width: "100%", background: "#0a0a0f", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" };
  const sectionStyle: React.CSSProperties = { background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 };

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
        <div style={{ ...sectionStyle, marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>프로필 사진</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div onClick={handleImageClick} style={{ position: "relative", width: 100, height: 100, borderRadius: 20, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
              {profileImage ? (
                <img src={profileImage} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: getAvatarColor(userDoc?.displayName || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: "white" }}>
                  {userDoc?.displayName?.charAt(0) || "?"}
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "0"}>
                <span style={{ color: "white", fontSize: 24 }}>📷</span>
              </div>
            </div>
            <div>
              <p style={{ color: "#9999bb", fontSize: 14, marginBottom: 8 }}>사진을 클릭하여 변경하세요</p>
              <p style={{ color: "#55556e", fontSize: 12, marginBottom: 12 }}>JPG, PNG, WebP · 최대 300KB</p>
              <button onClick={handleImageClick} disabled={uploadingImage} style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#9999bb", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: uploadingImage ? 0.6 : 1 }}>
                {uploadingImage ? "업로드 중..." : "📷 사진 변경"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 기본 정보 */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>기본 정보</h2>
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
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9999bb", textTransform: "uppercase", letterSpacing: "0.1em" }}>기술 스택</h2>
              {selectedSkills.length > 0 && <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>{selectedSkills.length}개 선택됨</span>}
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

          {/* SNS */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9999bb", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>SNS 링크</h2>
            {[{ name: "instagram", label: "📷 Instagram" }, { name: "artstation", label: "🎨 ArtStation" }, { name: "youtube", label: "📺 YouTube" }].map((sns) => (
              <div key={sns.name} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>{sns.label}</label>
                <input {...register(sns.name as any)} style={inputStyle} />
              </div>
            ))}
          </div>

          {/* 공개 설정 */}
          <div style={sectionStyle}>
            <label style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <input {...register("isPublic")} type="checkbox" style={{ width: 18, height: 18, accentColor: "#6366f1" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>포트폴리오 공개</div>
                <div style={{ color: "#55556e", fontSize: 13, marginTop: 2 }}>체크 해제 시 본인만 볼 수 있습니다</div>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "14px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "none", opacity: saving ? 0.6 : 1, boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
            {saving ? "저장 중..." : "프로필 저장하기"}
          </button>
        </form>

        {/* ── 비밀번호 변경 섹션 ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ ...sectionStyle, borderColor: showPasswordForm ? "#6366f1" : "#2e2e3f" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🔐 비밀번호 변경</h2>
                <p style={{ color: "#55556e", fontSize: 13 }}>정기적으로 비밀번호를 변경하면 보안이 강화됩니다</p>
              </div>
              <button
                onClick={() => { setShowPasswordForm(!showPasswordForm); passwordForm.reset(); }}
                style={{ background: showPasswordForm ? "#1a1a24" : "rgba(99,102,241,0.15)", border: `1px solid ${showPasswordForm ? "#2e2e3f" : "rgba(99,102,241,0.3)"}`, color: showPasswordForm ? "#9999bb" : "#818cf8", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {showPasswordForm ? "취소" : "변경하기"}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid #2e2e3f", paddingTop: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>현재 비밀번호 *</label>
                  <input {...passwordForm.register("currentPassword")} type="password" style={inputStyle} />
                  {passwordForm.formState.errors.currentPassword && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>새 비밀번호 * (8자 이상)</label>
                  <input {...passwordForm.register("newPassword")} type="password" style={inputStyle} />
                  {passwordForm.formState.errors.newPassword && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{passwordForm.formState.errors.newPassword.message}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>새 비밀번호 확인 *</label>
                  <input {...passwordForm.register("confirmPassword")} type="password" style={inputStyle} />
                  {passwordForm.formState.errors.confirmPassword && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <button type="submit" disabled={changingPassword} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", padding: "12px", borderRadius: 8, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", opacity: changingPassword ? 0.6 : 1 }}>
                  {changingPassword ? "변경 중..." : "🔐 비밀번호 변경"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
