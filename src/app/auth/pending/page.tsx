import Link from "next/link";

export default function PendingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#f0f0ff" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>승인 대기 중</h1>
        <p style={{ color: "#9999bb", lineHeight: 1.7, marginBottom: 32 }}>
          기업 계정 신청이 완료되었습니다.<br />
          관리자 승인 후 서비스를 이용하실 수 있습니다.<br />
          보통 영업일 1~2일 내에 처리됩니다.
        </p>
        <Link href="/" style={{ background: "#6366f1", color: "white", padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
