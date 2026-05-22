import Link from "next/link";
import type { StudentProfile } from "@/types";

export default function WorkCard({ student }: { student: StudentProfile }) {
  return (
    <Link href={`/portfolio/${student.uid}`}
      className="card card-hover group cursor-pointer block relative overflow-hidden">

      {/* 썸네일 */}
      <div className="aspect-square bg-gradient-to-br from-dark-600 to-dark-700 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center
                        text-text-muted group-hover:scale-105 transition-transform duration-500">
          <div className="text-center">
            <div className="text-4xl mb-2">🎨</div>
            <div className="text-xs">{student.department}</div>
          </div>
        </div>
      </div>

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="font-semibold text-sm text-text-primary truncate">{student.uid}</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {student.department} · {student.graduationYear}년
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {student.skills?.slice(0, 3).map((s: string) => (
              <span key={s} className="badge badge-accent text-xs">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
