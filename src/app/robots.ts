import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/gallery", "/portfolio/", "/work/"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://goodportfolio-five.vercel.app/sitemap.xml",
  };
}
