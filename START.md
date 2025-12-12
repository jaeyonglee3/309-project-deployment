# 프로젝트 시작 가이드

이 문서는 백엔드와 프론트엔드를 시작하는 방법을 설명합니다.

## 사전 요구사항

- Node.js (v16 이상 권장)
- npm 또는 yarn

## 백엔드 시작하기

### 1. 백엔드 디렉토리로 이동
```bash
cd backend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate deploy
```

### 4. 환경 변수 설정 (선택사항)
`.env` 파일을 생성하고 필요한 경우 설정:
```
JWT_SECRET=your-secret-key-here
```

### 5. 백엔드 서버 시작
포트 번호를 인자로 전달하여 실행:
```bash
node index.js 3000
```

또는 다른 포트 사용:
```bash
node index.js 5000
```

백엔드는 지정한 포트에서 실행됩니다 (예: `http://localhost:3000`)

## 프론트엔드 시작하기

### 1. 프론트엔드 디렉토리로 이동
```bash
cd frontend/LoyaltyHub
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 프론트엔드 개발 서버 시작
```bash
npm run dev
```

프론트엔드는 보통 `http://localhost:5173` (또는 다른 포트)에서 실행됩니다.

## 전체 시작 순서

1. **터미널 1 - 백엔드:**
   ```bash
   cd course-project/backend
   npm install
   npx prisma generate
   npx prisma migrate deploy
   node index.js 3000
   ```

2. **터미널 2 - 프론트엔드:**
   ```bash
   cd course-project/frontend/LoyaltyHub
   npm install
   npm run dev
   ```

## 문제 해결

### 백엔드가 시작되지 않는 경우
- Node.js가 설치되어 있는지 확인: `node --version`
- 포트가 이미 사용 중인지 확인
- 데이터베이스 마이그레이션이 완료되었는지 확인

### 프론트엔드가 시작되지 않는 경우
- Node.js가 설치되어 있는지 확인
- `node_modules` 폴더를 삭제하고 `npm install` 다시 실행
- 포트 충돌이 있는지 확인

### 데이터베이스 문제
- `prisma/dev.db` 파일이 생성되었는지 확인
- 마이그레이션을 다시 실행: `npx prisma migrate deploy`

## 추가 명령어

### 백엔드
- 슈퍼유저 생성: `npm run createsuperuser`
- 데이터베이스 초기화: `npm run clean` (주의: 모든 데이터 삭제)

### 프론트엔드
- 프로덕션 빌드: `npm run build`
- 빌드 미리보기: `npm run preview`
- 린트 검사: `npm run lint`

