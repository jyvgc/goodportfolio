"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getStudentProfile, getPublicWorksByAuthor, getUserDoc } from "@/lib/firestore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StudentProfile, Work, UserDoc } from "@/types";
import { useAuthStore } from "@/store/authStore";

export default function PortfolioPage() {
  const params = useParams();
  const uid = params.uid as string;
  const { firebaseUser, userDoc: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [userInfo, setUserInfo] = useState<UserDoc | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  // 관심 포트폴리오 등록
  const [showForm, setShowForm] = useState(false);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, u, w] = await Promise.all([
          getStudentProfile(uid),
          getUserDoc(uid),
          getPublicWorksByAuthor(uid),
        ]);
        setProfile(p);
        setUserInfo(u);
        setWorks(w);

        // 이미 등록한 관심 포트폴리오인지 확인
        if (firebaseUser && currentUser?.role === "company") {
          const snap = await getDoc(doc(db, "savedPortfolios", `${firebaseUser.uid}_student_${uid}`));
          if (snap.exists()) {
            setSaved(true);
            setMemo(snap.data().memo ?? "");
          }
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [uid, firebaseUser]);

  const handleSave = async () => {
    if (!firebaseUser || !userInfo) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "savedPortfolios", `${firebaseUser.uid}_student_${uid}`), {
        companyUid: firebaseUser.uid,
        workId: "",
        workTitle: `${userInfo.displayName} 포트폴리오`,
        workImage: userInfo.profileImage ?? "",
        authorName: userInfo.displayName ?? "",
        authorUid: uid,
        memo,
        savedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setShowForm(false);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", color:"#818cf8" }}>로딩 중...</div>
  );

  if (!userInfo) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f" }}>
      <Navbar />
      <div style={{ maxWidth:600, margin:"0 auto", padding:"120px 24px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <h1 style={{ color:"#f0f0ff", marginBottom:8 }}>포트폴리오를 찾을 수 없습니다</h1>
        <p style={{ color:"#9999bb", marginBottom:24 }}>존재하지 않거나 비공개된 포트폴리오입니다.</p>
        <Link href="/gallery" style={{ background:"#6366f1", color:"white", padding:"12px 32px", borderRadius:8, textDecoration:"none", fontWeight:600 }}>갤러리로 돌아가기</Link>
      </div>
      <Footer />
    </div>
  );

  const allWorks = [...works.filter((w) => w.isFeatured), ...works.filter((w) => !w.isFeatured)];

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff" }}>
      <Navbar />

      {/* 프로필 헤더 */}
      <div style={{ background:"#111118", borderBottom:"1px solid #2e2e3f", paddingTop:80 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"48px 24px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap" }}>
            <div style={{ width:96, height:96, borderRadius:20, flexShrink:0, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, boxShadow:"0 0 30px rgba(99,102,241,0.3)", overflow:"hidden" }}>
              {userInfo.profileImage ? <img src={userInfo.profileImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "🎨"}
            </div>

            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:8 }}>
                <h1 style={{ fontSize:28, fontWeight:900 }}>{userInfo.displayName || "이름 없음"}</h1>
                {profile?.department && <span style={{ padding:"4px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:"rgba(99,102,241,0.2)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.3)" }}>{profile.department}</span>}
                {profile?.graduationYear && <span style={{ padding:"4px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f" }}>{profile.graduationYear}년 졸업</span>}
              </div>
              {profile?.bio && <p style={{ color:"#9999bb", fontSize:15, lineHeight:1.7, marginBottom:16, maxWidth:600 }}>{profile.bio}</p>}
              {(profile?.skills?.length ?? 0) > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                  {profile?.skills?.map((s) => <span key={s} style={{ padding:"4px 12px", borderRadius:999, fontSize:12, background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f" }}>{s}</span>)}
                </div>
              )}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                {profile?.snsLinks?.instagram && <a href={profile.snsLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ padding:"6px 14px", borderRadius:8, fontSize:13, background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f", textDecoration:"none" }}>📷 Instagram</a>}
                {profile?.snsLinks?.artstation && <a href={profile.snsLinks.artstation} target="_blank" rel="noopener noreferrer" style={{ padding:"6px 14px", borderRadius:8, fontSize:13, background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f", textDecoration:"none" }}>🎨 ArtStation</a>}
                {profile?.snsLinks?.youtube && <a href={profile.snsLinks.youtube} target="_blank" rel="noopener noreferrer" style={{ padding:"6px 14px", borderRadius:8, fontSize:13, background:"#1a1a24", color:"#9999bb", border:"1px solid #2e2e3f", textDecoration:"none" }}>📺 YouTube</a>}

                {/* 관심 포트폴리오 등록 버튼 - 기업 승인 회원만 표시 */}
                {currentUser?.role === "company" && currentUser?.isApproved && (
                  <button onClick={() => setShowForm((p) => !p)}
                    style={{ background: saved ? "rgba(16,185,129,0.15)" : "#6366f1",
                      color: saved ? "#10b981" : "white",
                      border: saved ? "1px solid #10b981" : "none",
                      padding:"8px 20px", borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer" }}>
                    {saved ? "✅ 관심 포트폴리오 등록됨 (수정)" : "🔖 관심 포트폴리오 등록"}
                  </button>
                )}
              </div>

              {/* 메모 입력 폼 */}
              {showForm && (
                <div style={{ marginTop:16, background:"#1a1a24", border:"1px solid #2e2e3f", borderRadius:12, padding:20, maxWidth:480 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#f0f0ff", marginBottom:12 }}>🔖 관심 포트폴리오 등록</div>
                  <label style={{ display:"block", color:"#9999bb", fontSize:13, marginBottom:6 }}>메모</label>
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
                    style={{ width:"100%", background:"#111118", border:"1px solid #2e2e3f", borderRadius:8, color:"#f0f0ff", padding:"10px 14px", fontSize:14, resize:"vertical", boxSizing:"border-box", marginBottom:12 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ flex:1, background:"#6366f1", color:"#fff", border:"none", borderRadius:8, padding:"10px 0", fontWeight:700, cursor:"pointer" }}>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={() => setShowForm(false)}
                      style={{ flex:1, background:"#111118", color:"#9999bb", border:"1px solid #2e2e3f", borderRadius:8, padding:"10px 0", fontWeight:600, cursor:"pointer" }}>
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:24 }}>
              {[{ label:"작품", value:works.length }, { label:"조회수", value:works.reduce((a,w) => a+(w.viewCount||0), 0) }].map((s) => (
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.value}</div>
                  <div style={{ color:"#55556e", fontSize:12 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 작품 그리드 */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"48px 24px" }}>
        {allWorks.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎨</div>
            <p style={{ color:"#9999bb" }}>아직 등록된 작품이 없습니다.</p>
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ width:32, height:1, background:"#6366f1" }} />
              <span style={{ color:"#818cf8", fontSize:11, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase" }}>Works ({allWorks.length})</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {allWorks.map((w) => (
                <Link key={w.id} href={`/work/${w.id}`} style={{ textDecoration:"none" }}>
                  <div style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"all 0.3s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.5)"; (e.currentTarget as HTMLElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 40px rgba(99,102,241,0.2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor="#2e2e3f"; (e.currentTarget as HTMLElement).style.transform="translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>
                    <div style={{ aspectRatio:"1", background:"#1a1a24", overflow:"hidden", position:"relative" }}>
                      {w.images?.[0]
                        ? <img src={w.images[0]} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🎨</div>}
                      {w.isFeatured && <div style={{ position:"absolute", top:10, left:10, padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:600, background:"rgba(99,102,241,0.9)", color:"white" }}>⭐ 대표작</div>}
                      {(w.images?.length ?? 0) > 1 && <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.7)", color:"white", fontSize:10, padding:"2px 8px", borderRadius:999 }}>+{(w.images?.length??1)-1}</div>}
                    </div>
                    <div style={{ padding:14 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#f0f0ff", marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"rgba(99,102,241,0.15)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.3)" }}>
                          {Array.isArray(w.category) ? w.category[0] : w.category}
                        </span>
                        <span style={{ color:"#55556e", fontSize:11 }}>👁 {w.viewCount||0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
