"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
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
  onSuccess?: () => void; // 홈에서 임베드 시 라우팅 대신 콜백 사용 가능
}

export default function LoginForm({ onSuccess }: Props) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
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

const handleGoogle = async () => {
  try {
    setLoading(true);
    await loginWithGoogle("student"); // 리다이렉트 → 페이지 이동됨, 이후 코드 실행 안 됨
  } catch {
    toast.error("Google 로그인에 실패했습니다.");
    setLoading(false);
  }
};


  return (
    <div style={{ width:"100%", maxWidth:420 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#f0f0ff", marginBottom:6, textAlign:"center" }}>로그인</h2>
      <p style={{ color:"#55556e", fontSize:13, marginBottom:24, textAlign:"center" }}>계정에 로그인하세요</p>

      <button onClick={handleGoogle} disabled={loading}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600, color:"#f0f0ff", cursor:"pointer", marginBottom:16 }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Google로 계속하기
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:"#1a1a24" }} />
        <span style={{ color:"#2e2e3f", fontSize:12 }}>또는 이메일로</span>
        <div style={{ flex:1, height:1, background:"#1a1a24" }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display:"flex", flexDirection:"column", gap:12 }}>
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

