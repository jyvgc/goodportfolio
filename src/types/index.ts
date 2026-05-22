import { Timestamp } from "firebase/firestore";

export type UserRole = "student" | "company" | "admin";

export interface UserDoc {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  profileImage: string;
  isApproved: boolean;
  createdAt: Timestamp;
}

export interface StudentProfile {
  uid: string;
  department: "웹툰" | "게임콘텐츠";
  grade: number;
  graduationYear: number;
  skills: string[];
  bio: string;
  snsLinks: {
    instagram?: string;
    twitter?: string;
    artstation?: string;
    youtube?: string;
  };
  isPublic: boolean;
  viewCount: number;
  badges: string[];
}

export interface Work {
  id: string;
  authorUid: string;
  title: string;
  category: "웹툰" | "게임아트" | "캐릭터" | "배경" | "UI/UX" | "3D";
  description: string;
  images: string[];
  videoUrl?: string;
  tools: string[];
  isFeatured: boolean;
  isPublic: boolean;
  order: number;
  viewCount: number;
  createdAt: Timestamp;
}

export interface CompanyProfile {
  uid: string;
  companyName: string;
  industry: string;
  contactPerson: string;
  website?: string;
  description?: string;
  savedStudents: string[];
}

export interface Offer {
  id: string;
  fromCompanyUid: string;
  toStudentUid: string;
  jobTitle: string;
  employmentType: "정규직" | "인턴" | "프리랜서" | "계약직";
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
