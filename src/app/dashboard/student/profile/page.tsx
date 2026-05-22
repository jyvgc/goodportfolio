"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getStudentProfile, upsertStudentProfile } from "@/lib/firestore";
import { SKILL_OPTIONS, DEPARTMENT_OPTIONS } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuthStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      department: "웹툰스쿨",
      grade: 1,
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
      getStudentProfile(firebaseUser.uid).then((profile) => {
        if (profile) {
          reset({
            department: profile.department,
            grade: profile.grade,
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
  }, [firebaseUser, loading, router, reset]);

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
        grade: Number(data.grade),
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

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

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

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#9999bb" }}>기본 정보</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>학과</label>
                <select {...register("department")} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>
                  {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>학년</label>
                <select {...register("grade")} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>
                  {[1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>졸업 예정 연도</label>
              <select {...register("graduationYear")} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>
                {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>자기소개</label>
              <textarea {...register("bio")} rows={4} placeholder="자신을 소개해 주세요 (최대 500자)" style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, resize: "none", outline: "none" }} />
            </div>
          </div>

          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#9999bb" }}>기술 스택</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILL_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                  padding: "6px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                  background: selectedSkills.includes(s) ? "rgba(99,102,241,0.2)" : "#1a1a24",
                  color: selectedSkills.includes(s) ? "#818cf8" : "#9999bb",
                  border: selectedSkills.includes(s) ? "1px solid rgba(99,102,241,0.5)" : "1px solid #2e2e3f",
                  fontWeight: selectedSkills.includes(s) ? 600 : 400,
                }}>{selectedSkills.includes(s) ? "✓ " : ""}{s}</button>
              ))}
            </div>
          </div>

          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#9999bb" }}>SNS 링크</h2>
            {[
              { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
              { name: "artstation", label: "ArtStation", placeholder: "https://artstation.com/..." },
              { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
            ].map((sns) => (
              <div key={sns.name} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>{sns.label}</label>
                <input {...register(sns.name as any)} placeholder={sns.placeholder} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" }} />
              </div>
            ))}
          </div>

          <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input {...register("isPublic")} type="checkbox" style={{ width: 18, height: 18, accentColor: "#6366f1" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>포트폴리오 공개</div>
                <div style={{ color: "#55556e", fontSize: 13 }}>체크 해제 시 본인만 볼 수 있습니다</div>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} style={{ background: "#6366f1", color: "white", padding: "14px", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "none", opacity: saving ? 0.6 : 1 }}>
            {saving ? "저장 중..." : "프로필 저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
