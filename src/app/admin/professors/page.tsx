"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Professor {
  id: string; displayName: string; email: string;
  department: string; createdAt: any;
}

export default function AdminProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ displayName:"", email:"", department:"", password:"" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchProfessors(); }, []);

  const fetchProfessors = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((u: any) => u.role === "professor")
        .sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setProfessors(list);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addProfessor = async () => {
    setError("");
    if (!form.email.trim())       { setError("이메일을 입력하세요."); return; }
    if (!form.displayName.trim()) { setError("이름을 입력하세요."); return; }
    if (form.password.length < 8) { setError("임시 비밀번호는 8자 이상이어야 합니다."); return; }

    const exists = professors.find((p) => p.email === form.email.trim());
    if (exists) { setError("이미 등록된 이메일입니다."); return; }

    setSaving(true);
    try {
      // Firebase REST API로 Auth 계정 생성 (현재 로그인 세션 유지)
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            returnSecureToken: false,
          }),
        }
      );
      const data = await res.json();
      if (data.error) {
        if (data.error.message === "EMAIL_EXISTS") setError("이미 사용 중인 이메일입니다.");
        else setError("계정 생성 실패: " + data.error.message);
        return;
      }

      const uid = data.localId;

      // Firestore에 교수 문서 생성
      await setDoc(doc(db, "users", uid), {
        uid,
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        role: "professor",
        department: form.department.trim(),
        profileImage: "",
        isApproved: true,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      setProfessors((p) => [{
        id: uid,
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        createdAt: null,
      }, ...p]);
      setForm({ displayName:"", email:"", department:"", password:"" });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e: any) {
      console.error(e);
      setError("오류가 발생했습니다.");
    } finally { setSaving(false); }
  };

  const deleteProfessor = async (id: string) => {
    if (!confirm("교수 계정을 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "users", id));
    setProfessors((p) => p.filter((prof) => prof.id !== id));
  };

  const fmt = (ts: any) => {
    if (!ts) return "-";
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("ko-KR"); } catch { return "-"; }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"100px 24px 60px" }}>
        <h1 style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>교수 계정 관리</h1>
        <p style={{ color:"#55556e", fontSize:13, marginBottom:32 }}>
          이메일과 임시 비밀번호를 입력하면 즉시 교수 계정이 생성됩니다.
        </p>

        {/* 교수 등록 폼 */}
        <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:28, marginBottom:32 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:"#818cf8", marginBottom:20 }}>👨‍🏫 새 교수 계정 생성</h2>

          {error && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
              <p style={{ color:"#ef4444", fontSize:13, margin:0 }}>⚠ {error}</p>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>이름 *</label>
              <input value={form.displayName} onChange={(e) => setForm((p) => ({...p, displayName:e.target.value}))}
                style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>학과</label>
              <input value={form.department} onChange={(e) => setForm((p) => ({...p, department:e.target.value}))}
                style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>이메일 *</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({...p, email:e.target.value}))} type="email"
                style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>임시 비밀번호 * (8자 이상)</label>
              <input value={form.password} onChange={(e) => setForm((p) => ({...p, password:e.target.value}))} type="text"
                style={{ width:"100%", background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, boxSizing:"border-box" }} />
            </div>
          </div>

          <div style={{ background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#a855f7" }}>
            💡 교수에게 이메일과 임시 비밀번호를 전달하세요. 로그인 후 비밀번호를 변경할 수 있습니다.
          </div>

          <button onClick={addProfessor} disabled={saving}
            style={{ background:saving?"#3d3d52":"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"11px 32px", fontWeight:700, fontSize:14, cursor:saving?"not-allowed":"pointer" }}>
            {saving?"생성 중...":done?"✅ 계정 생성 완료!":"교수 계정 생성"}
          </button>
        </div>

        {/* 교수 목록 */}
        <h2 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>등록된 교수 ({professors.length}명)</h2>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:"#55556e" }}>⏳ 불러오는 중...</div>
        ) : professors.length === 0 ? (
          <p style={{ color:"#55556e", textAlign:"center", padding:40 }}>등록된 교수가 없습니다.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {professors.map((p) => (
              <div key={p.id} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:10, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#a855f7,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"white", flexShrink:0 }}>
                    {p.displayName?.charAt(0)||"👨‍🏫"}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{p.displayName}</div>
                    <div style={{ color:"#9999bb", fontSize:13 }}>{p.email}</div>
                    <div style={{ color:"#55556e", fontSize:12, marginTop:2 }}>
                      {p.department||"-"} · 등록일: {fmt(p.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:600, background:"rgba(168,85,247,0.15)", color:"#a855f7", border:"1px solid rgba(168,85,247,0.3)" }}>
                    👨‍🏫 교수
                  </span>
                  <button onClick={() => deleteProfessor(p.id)}
                    style={{ padding:"6px 16px", borderRadius:8, fontSize:13, fontWeight:600, border:"none", cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#ef4444" }}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
