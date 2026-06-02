"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserDoc } from "@/lib/firestore";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const studentSchema = z.object({
  department: z.enum(["웹툰스쿨", "비주얼게임컨텐츠스쿨"]),
  graduationStatus: z.enum(["졸업예정", "졸업생"]),
  displayName: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v, "이용약관에 동의해주세요"),
  agreePrivacy: z.boolean().refine((v) => v, "개인정보처리방침에 동의해주세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다", path: ["confirmPassword"],
});

const companySchema = z.object({
  companyName: z.string().min(1, "회사명을 입력하세요"),
  industry: z.string().min(1, "업종을 선택하세요"),
  companySize: z.string().min(1, "회사 규모를 선택하세요"),
  website: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  displayName: z.string().min(2, "담당자 이름을 입력하세요"),
  title: z.string().min(1, "직함을 입력하세요"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  phone: z.string().min(1, "전화번호를 입력하세요"),
  agreeTerms: z.boolean().refine((v) => v, "이용약관에 동의해주세요"),
  agreePrivacy: z.boolean().refine((v) => v, "개인정보처리방침에 동의해주세요"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다", path: ["confirmPassword"],
});

type StudentForm = z.infer<typeof studentSchema>;
type CompanyForm = z.infer<typeof companySchema>;

const INDUSTRIES = ["웹툰 제작사","게임 회사","광고/마케팅","애니메이션","출판사","교육기관","IT/스타트업","기타"];
const COMPANY_SIZES = ["1~10명","11~30명","30명 이상"];

const inputStyle: React.CSSProperties = {
  width:"100%", background:"#111118", border:"1px solid #2e2e3f",
  color:"#f0f0ff", padding:"12px 16px", borderRadius:10, fontSize:14, outline:"none",
};
const labelStyle: React.CSSProperties = {
  display:"block", fontSize:13, color:"#9999bb", marginBottom:6, fontWeight:500,
};
const errorStyle: React.CSSProperties = { color:"#f87171", fontSize:12, marginTop:4 };

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student"|"company">("student");
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { department:"웹툰스쿨", graduationStatus:"졸업예정", agreeTerms:false, agreePrivacy:false },
  });
  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { industry:"", companySize:"", agreeTerms:false, agreePrivacy:false },
  });

  // 교수 초대 이메일인지 확인
  const checkProfessorInvite = async (email: string) => {
    const docId = email.replace(/[.@]/g, "_");
    const snap = await getDoc(doc(db, "professorInvites", docId));
    return snap.exists() ? snap.data() : null;
  };
const onStudentSubmit = async (data: StudentForm) => {
  try {
    setLoading(true);
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    await updateProfile(cred.user, { displayName: data.displayName });
    await createUserDoc(cred.user.uid, {
      uid: cred.user.uid,
      email: data.email,
      displayName: data.displayName,
      role: "student",
      profileImage: "",
      isApproved: true,
    });
    // upsertStudentProfile 실패해도 가입은 성공으로 처리
    try {
      const { upsertStudentProfile } = await import("@/lib/firestore");
      await upsertStudentProfile(cred.user.uid, {
        uid: cred.user.uid,
        department: data.department as any,
        grade: data.graduationStatus === "졸업예정" ? 3 : 0,
        graduationYear: data.graduationStatus === "졸업생"
          ? new Date().getFullYear()
          : new Date().getFullYear() + 1,
        bio: "", skills: [], snsLinks: {},
        isPublic: false, viewCount: 0, badges: [],
      });
    } catch(e) {
      console.error("프로필 생성 오류:", e);
    }
    toast.success("가입 완료! 대시보드로 이동합니다.");
    router.push("/dashboard/student");
  } catch (e: any) {
    if (e.code === "auth/email-already-in-use") toast.error("이미 사용 중인 이메일입니다.");
    else toast.error("회원가입에 실패했습니다.");
  } finally { setLoading(false); }
};






  


  const onCompanySubmit = async (data: CompanyForm) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.displayName });
      await createUserDoc(cred.user.uid, {
        uid: cred.user.uid, email: data.email, displayName: data.displayName,
        role: "company", profileImage: "", isApproved: false,
      });
      const { db } = await import("@/lib/firebase");
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      await setDoc(doc(db, "companyProfiles", cred.user.uid), {
        uid: cred.user.uid, companyName: data.companyName, industry: data.industry,
        companySize: data.companySize, website: data.website || "",
        contactPerson: data.displayName, title: data.title, phone: data.phone,
        savedStudents: [], createdAt: serverTimestamp(),
      });
      toast.success("기업 계정 신청 완료! 관리자 승인 후 이용 가능합니다.");
      router.push("/auth/pending");
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") toast.error("이미 사용 중인 이메일입니다.");
      else toast.error("회원가입에 실패했습니다.");
    } finally { setLoading(false); }
  };

  const sectionStyle: React.CSSProperties = {
    background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, padding:24, marginBottom:16,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize:13, fontWeight:700, color:"#818cf8", marginBottom:20, textTransform:"uppercase" as const, letterSpacing:"0.1em",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0ff", padding:"40px 20px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, textDecoration:"none", marginBottom:40 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#6366f1,#22d3ee)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontWeight:900, fontSize:18 }}>G</span>
          </div>
          <span style={{ fontWeight:800, fontSize:22, color:"#f0f0ff" }}>
            Good<span style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Portfolio</span>
          </span>
        </Link>

        <h1 style={{ fontSize:26, fontWeight:800, textAlign:"center", marginBottom:6 }}>회원가입</h1>
        <p style={{ color:"#55556e", fontSize:14, textAlign:"center", marginBottom:32 }}>계정 유형을 선택해 주세요</p>

        {/* 교수 안내 */}
        <div style={{ background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:10, padding:"10px 16px", marginBottom:20, fontSize:13, color:"#a855f7" }}>
          👨‍🏫 
        </div>

        <div style={{ display:"flex", background:"#111118", borderRadius:12, padding:4, marginBottom:32, border:"1px solid #2e2e3f" }}>
          {[{ key:"student", label:"👨‍🎨 학생", desc:"포트폴리오 등록" }, { key:"company", label:"🏢 기업/HR", desc:"인재 채용" }].map((r) => (
            <button key={r.key} onClick={() => setRole(r.key as any)}
              style={{ flex:1, padding:"12px 8px", borderRadius:10, cursor:"pointer", border:"none", transition:"all 0.2s",
                background:role===r.key?"#6366f1":"transparent", color:role===r.key?"white":"#9999bb" }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{r.label}</div>
              <div style={{ fontSize:11, opacity:0.8, marginTop:2 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        {/* 학생 폼 */}
        {role === "student" && (
          <form onSubmit={studentForm.handleSubmit(onStudentSubmit)}>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>학과 선택</h3>
              <div style={{ display:"flex", gap:10 }}>
                {["웹툰스쿨","비주얼게임컨텐츠스쿨"].map((d) => (
                  <button key={d} type="button" onClick={() => studentForm.setValue("department", d as any)}
                    style={{ flex:1, padding:"14px 8px", borderRadius:10, cursor:"pointer",
                      border:studentForm.watch("department")===d?"2px solid #6366f1":"1px solid #2e2e3f",
                      background:studentForm.watch("department")===d?"rgba(99,102,241,0.15)":"#0a0a0f",
                      color:studentForm.watch("department")===d?"#818cf8":"#9999bb", fontWeight:600, fontSize:13 }}>
                    {d==="웹툰스쿨"?"🖊️ 웹툰스쿨":"🎮 비주얼게임컨텐츠스쿨"}
                  </button>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>졸업 상태</h3>
              <div style={{ display:"flex", gap:10 }}>
                {["졸업예정","졸업생"].map((s) => (
                  <button key={s} type="button" onClick={() => studentForm.setValue("graduationStatus", s as any)}
                    style={{ flex:1, padding:"14px 8px", borderRadius:10, cursor:"pointer",
                      border:studentForm.watch("graduationStatus")===s?"2px solid #6366f1":"1px solid #2e2e3f",
                      background:studentForm.watch("graduationStatus")===s?"rgba(99,102,241,0.15)":"#0a0a0f",
                      color:studentForm.watch("graduationStatus")===s?"#818cf8":"#9999bb", fontWeight:600, fontSize:14 }}>
                    {s==="졸업예정"?"🎓 졸업예정":"✅ 졸업생"}
                  </button>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>개인 정보</h3>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>이름 *</label>
                <input {...studentForm.register("displayName")} style={inputStyle} />
                {studentForm.formState.errors.displayName && <p style={errorStyle}>{studentForm.formState.errors.displayName.message}</p>}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>이메일 (로그인 ID) *</label>
                <input {...studentForm.register("email")} type="email" style={inputStyle} />
                {studentForm.formState.errors.email && <p style={errorStyle}>{studentForm.formState.errors.email.message}</p>}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>비밀번호 * (8자 이상)</label>
                <input {...studentForm.register("password")} type="password" style={inputStyle} />
                {studentForm.formState.errors.password && <p style={errorStyle}>{studentForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>비밀번호 확인 *</label>
                <input {...studentForm.register("confirmPassword")} type="password" style={inputStyle} />
                {studentForm.formState.errors.confirmPassword && <p style={errorStyle}>{studentForm.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div style={{ ...sectionStyle, marginBottom:24 }}>
              <h3 style={sectionTitleStyle}>약관 동의</h3>
              {[
                { name:"agreeTerms" as const,   label:"[필수] 이용약관 동의",          onClick:() => setShowTerms(true) },
                { name:"agreePrivacy" as const, label:"[필수] 개인정보처리방침 동의",   onClick:() => setShowPrivacy(true) },
              ].map((item) => (
                <label key={item.name} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:12 }}>
                  <input {...studentForm.register(item.name)} type="checkbox" style={{ width:18, height:18, accentColor:"#6366f1" }} />
                  <span style={{ fontSize:14, color:"#9999bb" }}>{item.label}</span>
                  <button type="button" onClick={item.onClick} style={{ marginLeft:"auto", background:"none", border:"none", color:"#6366f1", fontSize:12, cursor:"pointer" }}>보기</button>
                </label>
              ))}
              {studentForm.formState.errors.agreeTerms   && <p style={errorStyle}>{studentForm.formState.errors.agreeTerms.message}</p>}
              {studentForm.formState.errors.agreePrivacy && <p style={errorStyle}>{studentForm.formState.errors.agreePrivacy.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", background:"linear-gradient(135deg,#6366f1,#4f46e5)", color:"white", padding:"14px", borderRadius:10, fontSize:16, fontWeight:700, border:"none", cursor:"pointer", opacity:loading?0.6:1, boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
              {loading?"처리 중...":"학생으로 가입하기"}
            </button>
          </form>
        )}

        {/* 기업 폼 */}
        {role === "company" && (
          <form onSubmit={companyForm.handleSubmit(onCompanySubmit)}>
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#f59e0b" }}>
              ℹ️ 기업 계정은 관리자 승인 후 활성화됩니다. (영업일 1~2일 소요)
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>회사 정보</h3>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>회사명 *</label>
                <input {...companyForm.register("companyName")} style={inputStyle} />
                {companyForm.formState.errors.companyName && <p style={errorStyle}>{companyForm.formState.errors.companyName.message}</p>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}>업종 *</label>
                  <select {...companyForm.register("industry")} style={inputStyle}>
                    <option value="">선택</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {companyForm.formState.errors.industry && <p style={errorStyle}>{companyForm.formState.errors.industry.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>회사 규모 *</label>
                  <select {...companyForm.register("companySize")} style={inputStyle}>
                    <option value="">선택</option>
                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {companyForm.formState.errors.companySize && <p style={errorStyle}>{companyForm.formState.errors.companySize.message}</p>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>회사 홈페이지</label>
                <input {...companyForm.register("website")} style={inputStyle} />
                {companyForm.formState.errors.website && <p style={errorStyle}>{companyForm.formState.errors.website.message}</p>}
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>담당자 정보</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}>담당자 이름 *</label>
                  <input {...companyForm.register("displayName")} style={inputStyle} />
                  {companyForm.formState.errors.displayName && <p style={errorStyle}>{companyForm.formState.errors.displayName.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>직함 *</label>
                  <input {...companyForm.register("title")} style={inputStyle} />
                  {companyForm.formState.errors.title && <p style={errorStyle}>{companyForm.formState.errors.title.message}</p>}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>전화 *</label>
                <input {...companyForm.register("phone")} style={inputStyle} />
                {companyForm.formState.errors.phone && <p style={errorStyle}>{companyForm.formState.errors.phone.message}</p>}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>이메일 (로그인 ID) *</label>
                <input {...companyForm.register("email")} type="email" style={inputStyle} />
                {companyForm.formState.errors.email && <p style={errorStyle}>{companyForm.formState.errors.email.message}</p>}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>비밀번호 * (8자 이상)</label>
                <input {...companyForm.register("password")} type="password" style={inputStyle} />
                {companyForm.formState.errors.password && <p style={errorStyle}>{companyForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>비밀번호 확인 *</label>
                <input {...companyForm.register("confirmPassword")} type="password" style={inputStyle} />
                {companyForm.formState.errors.confirmPassword && <p style={errorStyle}>{companyForm.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div style={{ ...sectionStyle, marginBottom:24 }}>
              <h3 style={sectionTitleStyle}>약관 동의</h3>
              {[
                { name:"agreeTerms" as const,   label:"[필수] 이용약관 동의",        onClick:() => setShowTerms(true) },
                { name:"agreePrivacy" as const, label:"[필수] 개인정보처리방침 동의", onClick:() => setShowPrivacy(true) },
              ].map((item) => (
                <label key={item.name} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:12 }}>
                  <input {...companyForm.register(item.name)} type="checkbox" style={{ width:18, height:18, accentColor:"#6366f1" }} />
                  <span style={{ fontSize:14, color:"#9999bb" }}>{item.label}</span>
                  <button type="button" onClick={item.onClick} style={{ marginLeft:"auto", background:"none", border:"none", color:"#6366f1", fontSize:12, cursor:"pointer" }}>보기</button>
                </label>
              ))}
              {companyForm.formState.errors.agreeTerms   && <p style={errorStyle}>{companyForm.formState.errors.agreeTerms.message}</p>}
              {companyForm.formState.errors.agreePrivacy && <p style={errorStyle}>{companyForm.formState.errors.agreePrivacy.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", background:"linear-gradient(135deg,#22d3ee,#0891b2)", color:"white", padding:"14px", borderRadius:10, fontSize:16, fontWeight:700, border:"none", cursor:"pointer", opacity:loading?0.6:1, boxShadow:"0 4px 20px rgba(34,211,238,0.3)" }}>
              {loading?"처리 중...":"기업으로 가입하기"}
            </button>
          </form>
        )}

        <p style={{ textAlign:"center", fontSize:14, color:"#55556e", marginTop:24 }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color:"#818cf8", fontWeight:600, textDecoration:"none" }}>로그인</Link>
        </p>
      </div>

      {showTerms && (
        <div onClick={() => setShowTerms(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, maxWidth:560, width:"100%", maxHeight:"80vh", overflow:"auto", padding:32 }}>
            <h2 style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>이용약관</h2>
            <div style={{ color:"#9999bb", fontSize:13, lineHeight:1.8 }}>
              <p><strong style={{ color:"#f0f0ff" }}>제1조 (목적)</strong><br />이 약관은 GoodPortfolio 서비스의 이용 조건 및 절차를 규정합니다.</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>제2조 (서비스 이용)</strong><br />서비스는 웹툰·게임콘텐츠 학생들의 포트폴리오 전시 및 채용 연계를 위한 플랫폼입니다.</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>제3조 (금지 행위)</strong><br />타인의 정보 도용, 음란/폭력적 콘텐츠 업로드, 서비스 방해 행위 등은 금지됩니다.</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>제4조 (서비스 중단)</strong><br />시스템 점검, 보수 등으로 서비스가 일시 중단될 수 있습니다.</p>
            </div>
            <button onClick={() => setShowTerms(false)} style={{ marginTop:20, width:"100%", background:"#6366f1", color:"white", padding:"12px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600 }}>확인</button>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div onClick={() => setShowPrivacy(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#111118", border:"1px solid #2e2e3f", borderRadius:16, maxWidth:560, width:"100%", maxHeight:"80vh", overflow:"auto", padding:32 }}>
            <h2 style={{ fontSize:18, fontWeight:800, marginBottom:16 }}>개인정보처리방침</h2>
            <div style={{ color:"#9999bb", fontSize:13, lineHeight:1.8 }}>
              <p><strong style={{ color:"#f0f0ff" }}>수집하는 개인정보</strong><br />이름, 이메일, 학과(학생), 회사명/전화번호(기업), 포트폴리오 작품 등</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>수집 목적</strong><br />서비스 제공, 포트폴리오 전시, 채용 연계, 서비스 개선</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>보유 기간</strong><br />회원 탈퇴 시까지</p>
              <br /><p><strong style={{ color:"#f0f0ff" }}>제3자 제공</strong><br />이용자 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} style={{ marginTop:20, width:"100%", background:"#6366f1", color:"white", padding:"12px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600 }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
