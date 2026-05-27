# GoodPortfolio 업데이트 파일 패키지

## 적용 방법
각 파일을 프로젝트 루트 기준 경로에 덮어쓰기 하세요.

## 변경 파일 목록 및 적용 내용

| 파일 | 변경 내용 |
|------|-----------|
| src/app/admin/offers/page.tsx | ①회사정보 표시 ②승인 상태 ③일시+최신순 |
| src/app/dashboard/company/page.tsx | ②'관리자 승인' 상태 표시, 회사정보수정 링크 |
| src/app/dashboard/student/page.tsx | ②받은제안 섹션 완전 삭제 |
| src/app/dashboard/company/profile/page.tsx | ④기업 정보 수정 페이지 (신규) |
| src/app/dashboard/student/works/new/page.tsx | ⑤다중카테고리 선택, ⑧이미지 크기제한 |
| src/app/admin/settings/page.tsx | ⑤카테고리관리 ⑥툴관리 ⑦SNS설정 ⑩뱃지텍스트 |
| src/app/dashboard/student/profile/page.tsx | ⑦SNS링크 관리자설정 연동 |
| src/app/admin/students/page.tsx | ⑨학생 활성화/비활성화 토글 |
| src/app/(public)/page.tsx | ⑩뱃지텍스트편집, ⑬히어로이미지→work이동, 깜빡임수정 |
| src/components/layout/Footer.tsx | ⑪학과홈페이지 링크 추가 |

## Firebase 추가 작업 필요
- heroImages 컬렉션 문서에 `workId` 필드 추가 (⑬ 히어로→work 이동)
- works 쿼리에서 `isActive:true` 조건 추가 필요 (⑨ 학생활성화 연동)

## 비주얼게임컨텐츠스쿨 링크
실제 URL을 확인 후 Footer.tsx의 href 값을 수정하세요.
현재 임시값: https://game.gumi.ac.kr
