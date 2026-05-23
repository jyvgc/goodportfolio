"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { addDoc, collection, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { EMPLOYMENT_TYPES } from "@/lib/utils";

const schema = z.object({
  jobTitle: z.string().min(1, "직무명을 입력하세요"),
  employmentType: z.enum(["정규직", "인턴", "프리랜서", "계약직"]),
  message: z.string().min(10, "메시지를 10자 이상 입력하세요").max(500),
});
type FormData = z.infer<typeof schema>;

interface Props {
  toStudentUid: string;
  studentName: string;
  onClose: () => void;
}

export default function OfferModal({ toStudentUid, studentName, onClose }: Props) {
  const { firebaseUser, userDoc } = useAuthStore();
  const [sending, setSending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { employmentType: "인턴" },
  });

  const onSubmit = async (data: FormData) => {
    if (!firebaseUser) return;
    try {
      setSending(true);

      // Firestore에 저장
      await addDoc(collection(db, "offers"), {
        fromCompanyUid: firebaseUser.uid,
        toStudentUid,
        jobTitle: data.jobTitle,
        employmentType: data.employmentType,
        message: data.message,
        status: "pending_admin",
        adminApproved: false,
        createdAt: serverTimestamp(),
      });

      // 학생 이메일 가져오기
      const studentDoc = await getDoc(doc(db, "users", toStudentUid));
      const studentEmail = studentDoc.data()?.email;

      // 이메일 알림 발송 (관리자에게)
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (adminEmail) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_offer",
            toEmail: adminEmail,
            toName: "관리자",
            fromName: userDoc?.displayName || "기업",
            jobTitle: data.jobTitle,
            employmentType: data.employmentType,
            message: `${studentName}님에게 새로운 채용 제안이 도착했습니다.

직무: ${data.jobTitle}
고용형태: ${data.employmentType}

메시지: ${data.message}`,
          }),
        }).catch(() => {}); // 이메일 실패해도 계속 진행
      }

      toast.success("채용 제안을 발송했습니다! 관리자 검토 후 학생에게 전달됩니다.");
      onClose();
    } catch {
      toast.error("발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#111118", border: "1px solid #2e2e3f", borderRadius: 20, maxWidth: 560, width: "100%", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>채용 제안 보내기</h2>
            <p style={{ color: "#9999bb", fontSize: 13 }}>To. {studentName}</p>
          </div>
          <button onClick={onClose} style={{ background: "#1a1a24", border: "1px solid #2e2e3f", color: "#9999bb", width: 36, height: 36, borderRadius: 8, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#f59e0b" }}>
          ℹ️ 발송된 제안은 관리자 검토 후 학생에게 전달됩니다.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>직무명 *</label>
            <input {...register("jobTitle")} placeholder="예: 웹툰 작가, 게임 아트 디자이너" style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" }} />
            {errors.jobTitle && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{errors.jobTitle.message}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>고용 형태 *</label>
            <select {...register("employmentType")} style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, outline: "none" }}>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#9999bb", marginBottom: 6 }}>메시지 *</label>
            <textarea {...register("message")} rows={5} placeholder="학생에게 전달할 메시지를 작성하세요 (10~500자)" style={{ width: "100%", background: "#1a1a24", border: "1px solid #2e2e3f", color: "#f0f0ff", padding: "10px 14px", borderRadius: 8, fontSize: 14, resize: "none", outline: "none" }} />
            {errors.message && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{errors.message.message}</p>}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "#1a1a24", color: "#9999bb", border: "1px solid #2e2e3f", cursor: "pointer" }}>취소</button>
            <button type="submit" disabled={sending} style={{ flex: 2, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 700, background: "#6366f1", color: "white", border: "none", cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
              {sending ? "발송 중..." : "💼 채용 제안 보내기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
