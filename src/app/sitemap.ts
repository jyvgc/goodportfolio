import { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BASE_URL = "https://goodportfolio-five.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // 공개 학생 포트폴리오
    const studentsSnap = await getDocs(query(collection(db, "studentProfiles"), where("isPublic", "==", true)));
    const portfolioPages: MetadataRoute.Sitemap = studentsSnap.docs.map((d) => ({
      url: `${BASE_URL}/portfolio/${d.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // 공개 작품
    const worksSnap = await getDocs(query(collection(db, "works"), where("isPublic", "==", true)));
    const workPages: MetadataRoute.Sitemap = worksSnap.docs.map((d) => ({
      url: `${BASE_URL}/work/${d.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...portfolioPages, ...workPages];
  } catch {
    return staticPages;
  }
}
