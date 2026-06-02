"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserDoc } from "@/lib/firestore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const studentSchema = z.object({
  department: z.enum(["웹툰스쿨", "비주얼게임컨텐츠스쿨"]),
  graduationStatus: z.enum(["졸업반", "졸업생"]),
  displayName: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v, "이용약관에 동의해주세요"),
  agreePrivacy: z.boolean().refine((v) => v, "개인정보처리방침에 동의해주세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다", path: ["confirmPassword"],
});

const companySchema = z.object({
  companyName: z.string().min(1, "회사명을 입력하세요"),
  industry: z.string().min(1, "업종을 선택하세요"),
  companySize: z.string().min(1, "회사 규모를 선택하세요"),
  website: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  displayName: z.string().min(2, "담당자 이름을 입력하세요"),
  title: z.string().min(1, "직함을 입력하세요"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  agreeTerms: z.boolean().refine((v) => v, "이용약관에 동의해주세요"),
  agreePrivacy: z.boolean().refine((v) => v, "개인정보처리방침에 동의해주세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다", path: ["confirmPassword"],
});

type StudentForm = z.infer<typeof studentSchema>;
type CompanyForm = z.infer<typeof companySchema>;

const INDUSTRIES = ["웹툰 제작사","게임 회사","광고/마케팅","애니메이션","출판사","교육기관","IT/스타트업","기타"];
const COMPANY_SIZES = ["1~10명","11~30명","30명 이상"];

const inputStyle: React.CSSProperties = {
  width:"100%", background:"#111118", border:"1px solid #2e2e3f",
  color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none",
};
const labelStyle: React.CSSProperties = {
  display:"block", fontSize:13, color:"#9999bb", marginBottom:6, fontWeight:500,
};
const errorStyle: React.CSSProperties = { color:"#f87171", fontSize:12, marginTop:4 };

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student"|"company">("student");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { department:"웹툰스쿨", graduationStatus:"졸업반", agreeTerms:false, agreePrivacy:false },
  });
  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { industry:"", companySize:"", agreeTerms:false, agreePrivacy:false },
  });

  // 교수 초대 이메일인지 확인
  const checkProfessorInvite = async (email: string) => {
    const docId = email.replace(/[.@]/g, "_");
    const snap = await getDoc(doc(db, "professorInvites", docId));
    return snap.exists() ? snap.data() : null;
  };

  const onStudentSubmit = async (data: StudentForm) => {
    try {
      setLoading(true);
      // 교수 초대 이메일인지 먼저 확인
      const professorInvite = await checkProfessorInvite(data.email);

      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.displayName });

      if (professorInvite) {
        // 교수 계정으로 가입
        await createUserDoc(cred.user.uid, {
          uid: cred.user.uid,
          email: data.email,
          displayName: data.displayName,
          role: "professor",
          profileImage: "",
          isApproved: true,
          isActive: true,
        });
        toast.success("교수 계정으로 가입 완료!");
        router.push("/dashboard/professor");
      } else {
        // 일반 학생 계정
        await createUserDoc(cred.user.uid, {
          uid: cred.user.uid,
          email: data.email,
          displayName: data.displayName,
          role: "student",
          profileImage: "",
          isApproved: true,
          isActive: true,
        });
        const { upsertStudentProfile } = await import("@/lib/firestore");
        await upsertStudentProfile(cred.user.uid, {
          uid: cred.user.uid,
          department: data.department as any,
          grade: data.graduationStatus === "졸업반" ? 3 : 0,
          graduationYear: data.graduationStatus === "졸업생" ? new Date().getFullYear() : new Date().getFullYear() + 1,
          bio: "", skills: [], snsLinks: {}, isPublic: false, viewCount: 0, badges: [],
        });
        toast.success("가입 완료! 대시보드로 이동합니다.");
        router.push("/dashboard/student");
      }
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") toast.error("이미 사용 중인 이메일입니다.");
      else toast.error("회원가입에 실패했습니다.");
    } finally { setLoading(false); }
  };

  const onCompanySubmit = async (data: CompanyForm) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.displayName });
      await createUserDoc(cred.user.uid, {
        uid: cred.user.uid, email: data.email, displayName: data.displayName,
        role: "company", profileImage: "", isApproved: false,
      });
      const { db } = await import("@/lib/firebase");
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      await setDoc(doc(db, "companyProfiles", cred.user.uid), {
        uid: cred.user.uid, companyName: data.companyName, industry: data.industry,
        companySize: data.companySize, website: data.website || "",
        contactPerson: data.displayName, title: data.title, phone: data.phone,
        savedStudents: [], createdAt: serverTimestamp(),
      });
      toast.success("기업 계정 신청 완료! 관리자 승인 후 이용 가능합니다.");
      router.push("/auth/pending");
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") toast.error("이미 사용 중인 이메일입니다.");
      else toast.error("회원가입에 실패했습니다.");
    } finally { setLoading(false); }
  };

  const sectionStyle: React.CSSProperties = {
    background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:24, marginBottom:16,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize:13, fontWeight:700, color:"#818cf8", marginBottom:20, textTransform:"uppercase" as const, letterSpacing:"0.1em",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff", padding:"40px 20px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, textDecoration:"none", marginBottom:40 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontWeight:900, fontSize:18 }}>G</span>
          </div>
          <span style={{ fontWeight:800, fontSize:22, color:"#f0f0ff" }}>
            Good<span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Portfolio
