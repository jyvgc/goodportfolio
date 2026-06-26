"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});
type FormData = z.infer<typeof schema>;

const getDashboardPath = (role: string) => {
  if (role === "admin")     return "/admin";
  if (role === "company")   return "/dashboard/company";
  if (role === "professor") return "/dashboard/professor";
  return "/dashboard/student";
};

interface Props {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleSuccess = (role: string) => {
    toast.success("로그인 성공!");
    if (onSuccess) { onSuccess(); return; }
    router.push(getDashboardPath(role));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "student";
      handleSuccess(role);
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ width:"100%", maxWidth:420 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#f0f0ff", marginBottom:6, textAlign:"center" }}>로그인</h2>
      <p style={{ color:"#55556e", fontSize:13, marginBottom:24, textAlign:"center" }}>계정에 로그인하세요</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={{ display:"block", fontSize:13, color:"#9999bb", marginBottom:6, fontWeight:500 }}>이메일</label>
          <input {...register("email")} type="email"
            style={{ width:"100%", background:"#0a0a0f", border:"1px solid #2e2e3f", color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }} />
          {errors.email && <p style={{ color:"#f87171", fontSize:12, marginTop:4 }}>{errors.email.message}</p>}
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <label style={{ fontSize:13, color:"#9999bb", fontWeight:500 }}>비밀번호</label>
            <Link href="/forgot-password" style={{ fontSize:12, color:"#6366f1", textDecoration:"none" }}>비밀번호 찾기</Link>
          </div>
          <input {...register("password")} type="password"
            style={{ width:"100%", background:"#0a0a0f", border:"1px solid #2e2e3f", color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }} />
          {errors.password && <p style={{ color:"#f87171", fontSize:12, marginTop:4 }}>{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading}
          style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white", padding:"13px", borderRadius:10, fontSize:15, fontWeight:700, border:"none", cursor:"pointer", marginTop:4, opacity:loading?0.6:1, boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p style={{ textAlign:"center", fontSize:13, color:"#55556e", marginTop:20 }}>
        계정이 없으신가요?{" "}
        <Link href="/register" style={{ color:"#818cf8", fontWeight:600, textDecoration:"none" }}>회원가입</Link>
      </p>
    </div>
  );
}
