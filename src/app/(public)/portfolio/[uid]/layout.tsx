import type { Metadata } from "next";
import { getStudentProfile } from "@/lib/firestore";
import { getUserDoc } from "@/lib/firestore";

export async function generateMetadata({ params }: { params: { uid: string } }): Promise<Metadata> {
  try {
    const [profile, userInfo] = await Promise.all([
      getStudentProfile(params.uid),
      getUserDoc(params.uid),
    ]);

    if (!userInfo) {
      return { title: "포트폴리오를 찾을 수 없습니다" };
    }

    const name = userInfo.displayName || "학생";
    const dept = profile?.department || "";
    const skills = profile?.skills?.slice(0, 5).join(", ") || "";
    const bio = profile?.bio || `${name}의 포트폴리오`;

    return {
      title: `${name} — ${dept} 포트폴리오`,
      description: `${bio} | 기술스택: ${skills}`,
      openGraph: {
        title: `${name}의 포트폴리오 | GoodPortfolio`,
        description: bio,
        images: userInfo.profileImage ? [userInfo.profileImage] : [],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name}의 포트폴리오`,
        description: bio,
      },
    };
  } catch {
    return { title: "포트폴리오 | GoodPortfolio" };
  }
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
