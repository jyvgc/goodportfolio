"use client";
import { SKILL_OPTIONS } from "@/lib/utils";

export default function GalleryFilter() {
  return (
    <div className="space-y-6">
      {/* 학과 */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">학과</h3>
        <div className="space-y-1.5">
          {["전체", "웹툰", "게임콘텐츠"].map((d, i) => (
            <label key={d}
              className="flex items-center gap-3 text-sm cursor-pointer group py-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                transition-colors
                ${i === 0
                  ? "border-accent-500 bg-accent-500"
                  : "border-dark-500 group-hover:border-accent-500/50"}`}>
                {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className={i === 0 ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"}>
                {d}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* 졸업연도 */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">졸업연도</h3>
        <select className="input-base text-sm">
          <option value="">전체</option>
          {[2025, 2026, 2027, 2028].map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      <div className="divider" />

      {/* 기술 스택 */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">기술 스택</h3>
        <div className="flex flex-col gap-1.5">
          {SKILL_OPTIONS.slice(0, 10).map((s) => (
            <label key={s} className="flex items-center gap-3 text-sm cursor-pointer group py-0.5">
              <div className="w-4 h-4 rounded border border-dark-500
                              group-hover:border-accent-500/50 transition-colors
                              flex items-center justify-center">
              </div>
              <span className="text-text-secondary group-hover:text-text-primary transition-colors">{s}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
