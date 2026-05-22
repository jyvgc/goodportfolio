import type { Work } from "@/types";

export default function WorkGrid({ works }: { works: Work[] }) {
  if (works.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🎨</div>
        <p className="text-text-secondary">등록된 작품이 없습니다.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {works.map((w) => (
        <div key={w.id}
          className="card card-hover group cursor-pointer overflow-hidden">
          <div className="aspect-square overflow-hidden bg-dark-700">
            {w.images[0] ? (
              <img src={w.images[0]} alt={w.title}
                className="w-full h-full object-cover
                           group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <div className="text-3xl mb-1">🖼️</div>
                  <div className="text-xs">{w.category}</div>
                </div>
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="font-semibold text-sm text-text-primary truncate">{w.title}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="badge badge-accent text-xs">{w.category}</span>
              <span className="text-text-muted text-xs">👁 {w.viewCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
