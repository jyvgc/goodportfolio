import type { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Work } from "@/types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const snap = await getDoc(doc(db, "works", params.id));
    if (!snap.exists()) return { title: "작품을 찾을 수 없습니다" };

    const work = snap.data() as Work;
    const tools = work.tools?.slice(0, 5).join(", ") || "";

    return {
      title: `${work.title} — ${work.category} 작품`,
      description: work.description || `${work.title} | 카테고리: ${work.category} | 사용 툴: ${tools}`,
      openGraph: {
        title: `${work.title} | GoodPortfolio`,
        description: work.description || `${work.category} 작품`,
        images: work.images?.[0] ? [{ url: work.images[0], width: 1200, height: 630 }] : [],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: work.title,
        description: work.description || `${work.category} 작품`,
        images: work.images?.[0] ? [work.images[0]] : [],
      },
    };
  } catch {
    return { title: "작품 | GoodPortfolio" };
  }
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
