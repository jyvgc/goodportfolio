import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://goodportfolio-five.vercel.app"),
  title: {
    default: "GoodPortfolio — 웹툰·게임콘텐츠 학생 포트폴리오",
    template: "%s | GoodPortfolio",
  },
  description: "구미대학교 웹툰스쿨·비주얼게임컨텐츠스쿨 학생들의 포트폴리오 전시 및 산업체 채용 연계 플랫폼. 웹툰, 게임아트, 캐릭터, 배경, UI/UX 작품을 감상하세요.",
  keywords: ["웹툰", "게임콘텐츠", "포트폴리오", "구미대학교", "웹툰스쿨", "게임아트", "채용", "취업", "학생 포트폴리오"],
  authors: [{ name: "GoodPortfolio" }],
  creator: "GoodPortfolio",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://goodportfolio-five.vercel.app",
    siteName: "GoodPortfolio",
    title: "GoodPortfolio — 웹툰·게임콘텐츠 학생 포트폴리오",
    description: "구미대학교 웹툰·게임콘텐츠 학생들의 포트폴리오 플랫폼. 작품을 전시하고 산업체와 연결되세요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GoodPortfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoodPortfolio — 웹툰·게임콘텐츠 학생 포트폴리오",
    description: "구미대학교 웹툰·게임콘텐츠 학생들의 포트폴리오 플랫폼",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "구글 서치 콘솔 인증 코드 (나중에 추가)",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a24",
                color: "#f0f0ff",
                border: "1px solid #3d3d52",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
