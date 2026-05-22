import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "GoodPortfolio — 학생 포트폴리오 & 채용 플랫폼",
  description: "웹툰·게임콘텐츠 학생들의 포트폴리오 전시 및 산업체 채용 연계 플랫폼",
  openGraph: {
    title: "GoodPortfolio",
    description: "웹툰·게임콘텐츠 학생들의 포트폴리오 플랫폼",
    siteName: "GoodPortfolio",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-dark-900 text-text-primary antialiased">
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
