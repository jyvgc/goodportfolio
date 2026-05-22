import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 다크 배경 팔레트
        dark: {
          900: "#0a0a0f",  // 최상위 배경
          800: "#111118",  // 카드 배경
          700: "#1a1a24",  // 섹션 배경
          600: "#22222f",  // 호버 배경
          500: "#2e2e3f",  // 보더
          400: "#3d3d52",  // 비활성
        },
        // 포인트 컬러 (파란보라 그라디언트)
        accent: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        // 보조 컬러 (시안)
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        // 텍스트
        text: {
          primary:   "#f0f0ff",
          secondary: "#9999bb",
          muted:     "#55556e",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "Apple SD Gothic Neo", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
        "card-gradient": "linear-gradient(145deg, #1a1a24, #111118)",
        "accent-gradient": "linear-gradient(135deg, #6366f1, #22d3ee)",
        "glow-accent": "radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "card": "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(99,102,241,0.2)",
        "glow": "0 0 30px rgba(99,102,241,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
