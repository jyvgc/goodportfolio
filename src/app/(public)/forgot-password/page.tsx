"use client";
import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("이메일을 입력하세요."); return; }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") setError("등록되지 않은 이메일입니다.");
      else if (err.code === "auth/invalid-email") setError("올바른 이메일 형식이 아닙니다.");
      else setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, textDecoration:"none", marginBottom:40 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontWeight:900, fontSize:18 }}>G</span>
          </div>
          <span style={{ fontWeight:800, fontSize:22, color:"#f0f0ff" }}>
            Good<span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Portfolio</span>
          </span>
        </Link>

        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32 }}>
          {sent ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#f0f0ff", marginBottom:12 }}>이메일을 확인하세요</h2>
              <p style={{ color:"#9999bb", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
                <strong style={{ color:"#f0f0ff" }}>{email}</strong>로<br />
                비밀번호 재설정 링크를 발송했습니다.<br />
                이메일의 링크를 클릭하면 비밀번호를 변경할 수 있습니다.
              </p>
              <p style={{ color:"#55556e", fontSize:12, marginBottom:24 }}>이메일이 오지 않으면 스팸함을 확인해주세요.</p>
              <Link href="/login" style={{ display:"block", background:"#6366f1", color:"white", padding:"12px", borderRadius:8, textDecoration:"none", fontWeight:600, textAlign:"center" }}>
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize:22, fontWeight:800, color:"#f0f0ff", marginBottom:8 }}>비밀번호 찾기</h1>
              <p style={{ color:"#55556e", fontSize:14, marginBottom:28 }}>가입한 이메일로 재설정 링크를 보내드립니다.</p>

              {error && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
                  <p style={{ color:"#ef4444", fontSize:13, margin:0 }}>⚠ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>이메일</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"12px 16px", fontSize:14, boxSizing:"border-box", outline:"none" }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#3d3d52":"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white", border:"none", borderRadius:10, padding:"13px", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
                  {loading ? "전송 중..." : "재설정 링크 보내기"}
                </button>
              </form>

              <p style={{ textAlign:"center", fontSize:14, color:"#55556e", marginTop:20 }}>
                <Link href="/login" style={{ color:"#818cf8", fontWeight:600, textDecoration:"none" }}>← 로그인으로 돌아가기</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
