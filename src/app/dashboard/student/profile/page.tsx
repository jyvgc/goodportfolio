"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StudentProfilePage() {
  const { firebaseUser, userDoc } = useAuthStore();
  const [form, setForm] = useState({
    displayName: "", bio: "", department: "", graduationStatus: "",
    instagram: "", twitter: "", behance: "", github: "",
  });
  const [snsEnabled, setSnsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        const [uSnap, pSnap, sSnap] = await Promise.all([
          getDoc(doc(db, "users", firebaseUser.uid)),
          getDoc(doc(db, "studentProfiles", firebaseUser.uid)),
          getDoc(doc(db, "settings", "main")),
        ]);
        const u = uSnap.exists() ? uSnap.data() : {};
        const p = pSnap.exists() ? pSnap.data() : {};
        setForm({
          displayName:     u.displayName ?? "",
          bio:             p.bio         ?? "",
          department:      p.department  ?? "",
          graduationStatus: p.grade === 0 ? "졸업예정자" : "졸업반",
          instagram:       p.snsLinks?.instagram ?? "",
          twitter:         p.snsLinks?.twitter   ?? "",
          behance:         p.snsLinks?.behance    ?? "",
          github:          p.snsLinks?.github     ?? "",
        });
        if (sSnap.exists() && typeof sSnap.data().snsEnabled === "boolean") {
          setSnsEnabled(sSnap.data().snsEnabled);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [firebaseUser]);

  const save = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        displayName: form.displayName,
        updatedAt: new Date(),
      });
      await setDoc(doc(db, "studentProfiles", firebaseUser.uid), {
        bio: form.bio,
        department: form.department,
        grade: form.graduationStatus === "졸업생" ? 0 : 3,
        snsLinks: {
          instagram: form.instagram,
          twitter:   form.twitter,
          behance:   form.behance,
          github:    form.github,
        },
        updatedAt: new Date(),
      }, { merge: true });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, textarea = false) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 6 }}>{label}</label>
      {textarea
        ? <textarea value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} rows={3}
            style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
        : <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
            style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", borderRadius: 8, color: "#f0f0ff", padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }} />}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />
      <div style={{ textAlign: "center", padding: "200px 0", color: "#55556e" }}>⏳ 불러오는 중...</div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "100px 24px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>프로필 편집</h1>
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 32 }}>
          {field("이름", "displayName")}
          {field("자기소개", "bio", true)}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 8 }}>학과</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["웹툰스쿨", "비주얼게임컨텐츠스쿨"].map((d) => (
                <button key={d} type="button" onClick={() => setForm((p) => ({ ...p, department: d }))}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                    border: form.department === d ? "2px solid #6366f1" : "1px solid #2e2e3f",
                    background: form.department === d ? "rgba(99,102,241,0.15)" : "#1a1a24",
                    color: form.department === d ? "#818cf8" : "#9999bb" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9999bb", fontSize: 13, marginBottom: 8 }}>졸업 상태</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["졸업반", "졸업생"].map((s) => (
                <button key={s} type="button" onClick={() => setForm((p) => ({ ...p, graduationStatus: s }))}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                    border: form.graduationStatus === s ? "2px solid #6366f1" : "1px solid #2e2e3f",
                    background: form.graduationStatus === s ? "rgba(99,102,241,0.15)" : "#1a1a24",
                    color: form.graduationStatus === s ? "#818cf8" : "#9999bb" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {snsEnabled && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #2e2e3f" }}>
              <h3 style={{ color: "#818cf8", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔗 SNS 링크</h3>
              {field("Instagram", "instagram")}
              {field("Twitter / X", "twitter")}
              {field("Behance", "behance")}
              {field("GitHub", "github")}
            </div>
          )}

          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#3d3d52" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "14px 0", fontWeight: 700, fontSize: 16, cursor: saving ? "not-allowed" : "pointer", marginTop: 8 }}>
            {saving ? "저장 중..." : done ? "✅ 저장 완료!" : "저장하기"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
