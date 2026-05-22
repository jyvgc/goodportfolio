import type { StudentProfile } from "@/types";

export default function StudentProfileHeader({ profile }: { profile: StudentProfile }) {
  return (
    <div className="card p-8 mb-8 relative overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row gap-6 items-start">
        {/* 프로필 이미지 */}
        <div className="w-24 h-24 rounded-2xl bg-accent-gradient
                        flex items-center justify-center text-4xl shrink-0 shadow-glow">
          🎨
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <h1 className="text-2xl font-bold text-text-primary">{profile.uid}</h1>
            <span className="badge badge-accent">{profile.department}</span>
            <span className="badge badge-gray">{profile.graduationYear}년 졸업</span>
          </div>
          <p className="text-text-secondary mb-4 leading-relaxed">
            {profile.bio || "소개글이 없습니다."}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((s) => (
              <span key={s} className="badge badge-gray">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
