"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function StudentPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.next.length < 8) { setError("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (form.next !== form.confirm) { setError("새 비밀번호가 일치하지 않습니다."); return; }
    const user = auth.currentUser;
    if (!user || !user.email) { setError("로그인 정보를 찾을 수 없습니다."); return; }
    setLoading(true);
    try {
      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email, form.current);
      await reauthenticateWithCredential(user, credential);
      // 비밀번호 변경
      await updatePassword(user, form.next);
      setDone(true);
      setTimeout(() => router.push("/dashboard/student"), 2000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential")
        setError("현재 비밀번호가 올바르지 않습니다.");
      else if (err.code === "auth/too-many-requests")
        setError("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      else setError("오류가 발생했습니다: " + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:480, margin:"0 auto", padding:"100px 24px 60px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:32 }}>
          <Link href="/dashboard/student" style={{ color:"#9999bb", textDecoration:"none", fontSize:14 }}>← 대시보드</Link>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:32 }}>비밀번호 변경</h1>

        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:32 }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
              <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>비밀번호가 변경되었습니다!</h2>
              <p style={{ color:"#9999bb", fontSize:14 }}>잠시 후 대시보드로 이동합니다...</p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:8, padding:"10px 14px", marginBottom:20 }}>
                  <p style={{ color:"#ef4444", fontSize:13, margin:0 }}>⚠ {error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                {[
                  { label:"현재 비밀번호", key:"current" },
                  { label:"새 비밀번호 (8자 이상)", key:"next" },
                  { label:"새 비밀번호 확인", key:"confirm" },
                ].map((f) => (
                  <div key={f.key} style={{ marginBottom:20 }}>
                    <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>{f.label}</label>
                    <input type="password" value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"12px 16px", fontSize:14, boxSizing:"border-box", outline:"none" }} />
                  </div>
                ))}
                <button type="submit" disabled={loading}
                  style={{ width:"100%", background:loading?"#3d3d52":"#6366f1", color:"white", border:"none", borderRadius:10, padding:"13px", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginTop:8 }}>
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
