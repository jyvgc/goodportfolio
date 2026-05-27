"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
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
  if (role === "admin")   return "/admin";
  if (role === "company") return "/dashboard/company";
  return "/dashboard/student";
};

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "student";
      toast.success("로그인 성공!");
      router.push(getDashboardPath(role));
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const cred = await loginWithGoogle("student");
      const snap = await getDoc(doc(db, "users", cred.uid));
      const role = snap.exists() ? snap.data().role : "student";
      toast.success("로그인 성공!");
      router.push(getDashboardPath(role));
    } catch {
      toast.error("Google 로그인에 실패했습니다.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex" }}>
      <div style={{ flex:1, display:"none", background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", position:"relative", overflow:"hidden", alignItems:"center", justifyContent:"center", flexDirection:"column", padding:60 }} className="login-visual">
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)" }} />
        <div style={{ position:"relative", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:24 }}>🎨</div>
          <h2 style={{ fontSize:32, fontWeight:900, color:"#f0f0ff", marginBottom:16, lineHeight:1.2 }}>당신의 작품을<br /><span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>세상에 선보이세요</span></h2>
          <p style={{ color:"#9999bb", fontSize:15, lineHeight:1.7 }}>웹툰·게임콘텐츠 학생들의<br />포트폴리오 & 채용 연계 플랫폼</p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:40 }}>
            {["학생 120+","작품 850+","기업 30+"].map((s) => (
              <div key={s} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 20px", color:"#9999bb", fontSize:13 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", minHeight:"100vh" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:40, justifyContent:"center" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"white", fontWeight:900, fontSize:18 }}>G</span>
            </div>
            <span style={{ fontWeight:800, fontSize:22, color:"#f0f0ff" }}>Good<span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Portfolio</span></span>
          </Link>

          <h1 style={{ fontSize:26, fontWeight:800, color:"#f0f0ff", marginBottom:6, textAlign:"center" }}>로그인</h1>
          <p style={{ color:"#55556e", fontSize:14, marginBottom:32, textAlign:"center" }}>계정에 로그인하세요</p>

          <button onClick={handleGoogle} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"13px 20px", fontSize:14, fontWeight:600, color:"#f0f0ff", cursor:"pointer", marginBottom:20 }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google로 계속하기
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:"#1a1a24" }} />
            <span style={{ color:"#2e2e3f", fontSize:12 }}>또는 이메일로</span>
            <div style={{ flex:1, height:1, background:"#1a1a24" }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:13, color:"#9999bb", marginBottom:6, fontWeight:500 }}>이메일</label>
              <input {...register("email")} type="email" style={{ width:"100%", background:"#111118", border:"1px solid #2e2e3f", color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none" }} />
              {errors.email && <p style={{ color:"#f87171", fontSize:12, marginTop:4 }}>{errors.email.message}</p>}
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:13, color:"#9999bb", fontWeight:500 }}>비밀번호</label>
                {/* 비밀번호 찾기 링크 */}
                <Link href="/forgot-password" style={{ fontSize:12, color:"#6366f1", textDecoration:"none" }}>비밀번호 찾기</Link>
              </div>
              <input {...register("password")} type="password" style={{ width:"100%", background:"#111118", border:"1px solid #2e2e3f", color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none" }} />
              {errors.password && <p style={{ color:"#f87171", fontSize:12, marginTop:4 }}>{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white", padding:"13px", borderRadius:10, fontSize:15, fontWeight:700, border:"none", cursor:"pointer", marginTop:4, opacity:loading?0.6:1, boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p style={{ textAlign:"center", fontSize:14, color:"#55556e", marginTop:24 }}>
            계정이 없으신가요?{" "}
            <Link href="/register" style={{ color:"#818cf8", fontWeight:600, textDecoration:"none" }}>회원가입</Link>
          </p>
        </div>
      </div>
      <style>{`@media(min-width:900px){.login-visual{display:flex !important;}}`}</style>
    </div>
  );
}
