"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

const schema = z.object({
  displayName: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  role: z.enum(["student", "company"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });
  const role = watch("role");

  const onSubmit = async (data: FormData) => {
    if (data.role === "student" && !data.email.endsWith("@gumi.ac.kr")) {
      toast.error("학생은 학교 이메일(@gumi.ac.kr)로 가입해야 합니다.");
      return;
    }
    try {
      setLoading(true);
      await registerWithEmail(data.email, data.password, data.displayName, data.role as UserRole);
      toast.success(
        data.role === "student"
          ? "가입 완료! 대시보드로 이동합니다."
          : "기업 계정 신청 완료! 관리자 승인 후 이용 가능합니다."
      );
      router.push(data.role === "student" ? "/dashboard/student" : "/");
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        toast.error("이미 사용 중인 이메일입니다.");
      } else {
        toast.error("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md card p-8">
        <Link href="/" className="block text-center mb-8">
          <span className="text-3xl font-extrabold text-brand-700">Good</span>
          <span className="text-3xl font-extrabold text-gray-800">Portfolio</span>
        </Link>
        <h1 className="text-xl font-bold mb-6 text-center">회원가입</h1>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          {(["student", "company"] as const).map((r) => (
            <label key={r} className={`flex-1 text-center py-2.5 text-sm font-medium cursor-pointer transition-colors
              ${role === r ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <input type="radio" {...register("role")} value={r} className="hidden" />
              {r === "student" ? "👨‍🎨 학생" : "🏢 기업/HR"}
            </label>
          ))}
        </div>

        {role === "student" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
            ℹ️ 학생은 학교 이메일 <strong>@gumi.ac.kr</strong> 로만 가입 가능합니다.
          </div>
        )}
        {role === "company" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
            ℹ️ 기업 계정은 관리자 승인 후 활성화됩니다. (영업일 1~2일 소요)
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {role === "student" ? "이름" : "담당자 이름"}
            </label>
            <input {...register("displayName")} className="input-base"
              placeholder={role === "student" ? "홍길동" : "김채용"} />
            {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input {...register("email")} type="email" className="input-base"
              placeholder={role === "student" ? "student@gumi.ac.kr" : "hr@company.com"} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input {...register("password")} type="password" className="input-base"
              placeholder="8자 이상" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
            <input {...register("confirmPassword")} type="password" className="input-base"
              placeholder="비밀번호 재입력" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
