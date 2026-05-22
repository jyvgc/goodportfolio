"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export default function AdminNoticesPage() {
  const router = useRouter();
  const { firebaseUser, userDoc, loading } = useAuthStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!firebaseUser || userDoc?.role !== "admin")) { router.push("/"); return; }
    if (firebaseUser && userDoc?.role === "admin") fetchNotices();
  }, [firebaseUser, userDoc, loading, router]);

  const fetchNotices = async () => {
    try {
      const snap = await getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc")));
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
    } catch {
      const snap = await getDocs(collection(db, "notices"));
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) { toast.error("제목과 내용을 입력하세요."); return; }
    try {
      setSaving(true);
      await addDoc(collection(db, "notices"), { title, content, createdAt: serverTimestamp() });
      toast.success("공지사항이 등록되었습니다!");
      setTitle(""); setContent("");
      fetchNotices();
    } catch { toast.error("등록에 실패했습니다."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "notices", id));
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("삭제되었습니다.");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>로딩 중...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0ff" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2e2e3f", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "#55556e", textDecoration: "none", fontSize: 14 }}>← 관리자</Link>
          <span style={{ color: "#2e2e3f" }}>/</span>
          <span style={{ color: "#9999bb", fontSize: 14 }}>공지사항</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 32 }}>공지사항 관리</h1>

        {/* 새 공지 등록 */}
        <div style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#9999bb" }}>새 공지 등록</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 12 }} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" rows={4} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none", resize: "none", marginBottom: 12 }} />
          <button onClick={handleAdd} disabled={saving} style={{ background: "#6366f1", color: "white", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "등록 중..." : "공지 등록하기"}
          </button>
        </div>

        {/* 공지 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#55556e" }}>등록된 공지사항이 없습니다.</div>
          ) : notices.map((n) => (
            <div key={n.id} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{n.title}</div>
                <button onClick={() => handleDelete(n.id)} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>삭제</button>
              </div>
              <p style={{ color: "#9999bb", fontSize: 13, lineHeight: 1.6 }}>{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
