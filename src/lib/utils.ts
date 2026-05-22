import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | { seconds: number } | undefined): string {
  if (!date) return "";
  const d = "seconds" in date ? new Date(date.seconds * 1000) : date;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export const SKILL_OPTIONS = [
  "Clip Studio", "Photoshop", "Illustrator", "Procreate",
  "Unity", "Unreal Engine", "Blender", "Maya", "ZBrush",
  "After Effects", "Premiere Pro", "Figma", "Spine 2D",
  "3ds Max", "Substance Painter",
];

export const CATEGORY_OPTIONS = ["웹툰", "게임아트", "캐릭터", "배경", "UI/UX", "3D"] as const;

export const DEPARTMENT_OPTIONS = ["웹툰스쿨", "비주얼게임컨텐츠스쿨"] as const;

export const EMPLOYMENT_TYPES = ["정규직", "인턴", "프리랜서", "계약직"] as const;
