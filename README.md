# GoodPortfolio 🎨

> 웹툰 · 게임콘텐츠 학생 포트폴리오 & 채용 연계 플랫폼  
> **Next.js 14 + Firebase + Vercel + Cloudinary**

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
# .env.local 파일을 열어 Firebase, Cloudinary 키 입력
```

### 3. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. **Authentication** → 이메일/비밀번호 + Google 로그인 활성화
3. **Firestore Database** → 데이터베이스 생성 (프로덕션 모드)
4. `firestore.rules` 파일 내용을 Firebase Console에 붙여넣기
5. 프로젝트 설정 → 웹 앱 추가 → 설정값을 `.env.local`에 입력

### 4. Cloudinary 설정
1. [Cloudinary Console](https://cloudinary.com) → 가입
2. Settings → Upload → Upload Presets → Add Upload Preset
3. Preset name: `goodportfolio_unsigned`, Signing Mode: **Unsigned**
4. Cloud name을 `.env.local`에 입력

### 5. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

---

## 📁 주요 디렉토리

```
src/
├── app/           # Next.js App Router 페이지
│   ├── (public)/  # 비회원 접근 가능 (홈, 갤러리, 포트폴리오)
│   ├── (auth)/    # 로그인, 회원가입
│   └── dashboard/ # 학생/기업 대시보드
├── components/    # 재사용 컴포넌트
├── hooks/         # useAuth 훅
├── lib/           # Firebase, Firestore, Cloudinary 유틸
├── store/         # Zustand 전역 상태
└── types/         # TypeScript 타입 정의
```

---

## 🌐 Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정 (Vercel Dashboard → Settings → Environment Variables)
# .env.local의 모든 키를 동일하게 입력
```

---

## 📋 개발 Phase 현황

- [x] **Phase 0** — 프로젝트 구조, 환경 설정
- [x] **Phase 1** — Firebase 인증 (이메일 + Google OAuth)
- [ ] **Phase 2** — 학생 포트폴리오 CRUD + 이미지 업로드
- [ ] **Phase 3** — 갤러리 & 검색/필터
- [ ] **Phase 4** — 기업 HR 채용 연계 시스템
- [ ] **Phase 5** — 관리자 패널
- [ ] **Phase 6** — PDF 생성, SEO, 도메인 연결

---

## 🔑 테스트 계정 생성

1. `/auth/register` 접속
2. 학생: `test@gumi.ac.kr` / 비밀번호 8자 이상
3. Firebase Console → Firestore → `users` 컬렉션에서 `isApproved: true` 확인
