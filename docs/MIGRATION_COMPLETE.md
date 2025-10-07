# Next.js to Vite Migration - Complete ✅

## 완료 날짜
2025-10-07

## 마이그레이션 개요
Next.js 15 + App Router → Vite 6 + React Router 7 마이그레이션 완료
3-tier Volatility-based Architecture → 5-layer Clean Architecture 전환 완료

---

## ✅ 완료된 작업

### 1. 기술 스택 변경
- ❌ Next.js 15.5.3 (App Router, Server Components)
- ❌ Webpack-based build
- ✅ Vite 6.3.6 (Fast build, HMR)
- ✅ React Router 7.1.3 (client-side routing)
- ✅ React 19.1.0 (유지)
- ✅ TypeScript 5.9.3 (유지)
- ✅ Tailwind CSS v4 (유지)
- ✅ TanStack Query v5 (유지)

### 2. 아키텍처 재구성
**Before: 3-tier Volatility-based**
```
src/
├── domain/          # Tier 3 (Stable)
├── infrastructure/  # Tier 2 (Moderate)
└── app/            # Tier 1 (Volatile)
```

**After: 5-layer Clean Architecture**
```
src/
├── domain/          # 🟦 Most Pure - Entities, DTOs
├── application/     # 🟩 Use cases, Ports (empty for now)
├── infrastructure/  # 🟨 Generic tools, Library wrappers
├── adapters/        # 🟧 Repository implementations
│   └── repositories/
│       ├── index.ts
│       ├── post.static.repository.ts
│       └── project.static.repository.ts
└── presentation/    # 🟥 React components
    ├── components/
    ├── pages/
    ├── layouts/
    └── globals.css
```

### 3. 라우팅
- ✅ React Router 설정 완료
- ✅ Routes:
  - `/` - HomePage (Blog + About tabs)
  - `/posts/:slug` - PostDetailPage
  - `/editor` - EditorPage (dev only, stub)

### 4. 데이터 레이어
- ✅ **StaticPostRepository** 구현 (client-only)
  - `getPosts()` - `/posts.json`에서 로드
  - `getPostBySlug()` - `/post-{slug}.json`에서 로드
  - `createPost()`, `updatePost()`, `deletePost()` - `/api/posts` (미완성)
- ✅ **StaticProjectRepository** 구현
  - `getProjects()` - `/projects.json`에서 로드
- ✅ **빌드 스크립트**: `scripts/build-static-data-simple.mjs`
  - Markdown → JSON 변환
  - `public/posts.json`, `public/projects.json` 생성
  - 개별 포스트 파일 생성 (`public/post-{slug}.json`)

### 5. 스타일링
- ✅ Tailwind CSS v4 설정
- ✅ PostCSS 설정
- ✅ globals.css 마이그레이션
- ✅ 모든 기존 스타일 유지

### 6. 프로덕션 빌드
- ✅ 빌드 성공: 854ms
- ✅ 번들 사이즈:
  - CSS: 53.63 kB (gzip: 9.08 kB)
  - JS: 268.91 kB (gzip: 85.61 kB)
- ✅ Static export 가능
- ✅ GitHub Pages 배포 준비 완료

---

## 🚧 미완성 작업

### Editor 기능
**현재 상태**: EditorPage stub만 존재
**필요한 작업**: 로컬 개발용 에디터 + API 서버

---

## 파일 구조 (중요한 것만)

### Configuration
- `vite.config.ts` - Vite 설정 (path aliases, build config)
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App TypeScript 설정 (5-layer aliases)
- `tsconfig.node.json` - Node scripts 설정
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS
- `package.json` - Dependencies & scripts

### Scripts
- `scripts/build-static-data-simple.mjs` - Markdown → JSON 변환
- `scripts/build-static-data.ts.old` - Old script (사용 안함)

### Source Structure
```
src/
├── main.tsx                 # Entry point
├── domain/                  # 비즈니스 로직 (Next.js에서 그대로)
│   ├── blog/
│   │   ├── entities/post.entity.ts
│   │   ├── use-cases/*.ts
│   │   ├── ports/post-repository.port.ts
│   │   ├── policies/post-visibility.policy.ts
│   │   ├── services/markdown.service.ts
│   │   └── index.ts (createBlogApi factory)
│   └── projects/
├── adapters/
│   ├── repositories/
│   │   ├── index.ts (getPostRepository, getProjectRepository)
│   │   ├── post.static.repository.ts
│   │   └── project.static.repository.ts
│   └── react-query/
│       └── query-client.ts
├── presentation/
│   ├── App.tsx
│   ├── globals.css
│   ├── components/
│   │   └── tabs/TabsUI.tsx
│   ├── layouts/
│   │   └── Header.tsx
│   └── pages/
│       ├── home/HomePage.tsx
│       ├── post-detail/PostDetailPage.tsx
│       └── editor/EditorPage.tsx (stub)
└── shared/
    └── utils/
```

---

## 데이터 흐름

### Production (Static Export)
```
Markdown files (storage/posts/*.md)
    ↓ (build time)
scripts/build-static-data-simple.mjs
    ↓
public/*.json
    ↓ (runtime)
StaticPostRepository.getPosts()
    ↓
createBlogApi(repository)
    ↓
React Query (useQuery)
    ↓
HomePage / PostDetailPage
```

### Development
```
Same as production
(에디터는 별도 API 서버 필요)
```

---

## 주요 변경사항 요약

### 제거된 것
- ❌ Next.js App Router
- ❌ Server Components (RSC)
- ❌ Next.js API Routes (`app/api/`)
- ❌ `getServerSideProps` / `generateStaticParams`
- ❌ Next.js Image Optimization
- ❌ FileSystemPostRepository (서버 전용)

### 추가/변경된 것
- ✅ React Router (client-side only)
- ✅ StaticPostRepository (fetch from JSON)
- ✅ Vite dev server (HMR)
- ✅ Static JSON pre-build
- ✅ 5-layer 아키텍처 폴더 구조

### 유지된 것
- ✅ Domain layer 비즈니스 로직 100% 동일
- ✅ Post entity, use cases, policies
- ✅ Markdown → HTML 파이프라인 (marked + shiki + DOMPurify)
- ✅ TanStack Query 상태 관리
- ✅ Tailwind CSS 스타일
- ✅ UI/UX 완전 동일

---

## 빌드 & 실행 명령어

### Development
```bash
npm run dev              # Vite dev server (http://localhost:3000)
```

### Production Build
```bash
npm run build:data       # Markdown → JSON
npm run build            # TypeScript check + Vite build
npm run preview          # Preview production build (http://localhost:4173)
```

### Static Export
```bash
npm run export           # build + copy CNAME + .nojekyll
```

### Data Migration
```bash
npm run migrate-posts    # Migrate old posts to new format
```

---

## 알려진 이슈 / 제한사항

### 1. Editor 미완성
- EditorPage는 stub만 존재
- API 엔드포인트 없음 (`/api/posts/*`)
- 파일 저장 기능 없음

### 2. Draft 관리
- 현재는 published 포스트만 static JSON에 포함
- Draft는 로컬 파일시스템에만 존재
- 에디터 없이는 draft 관리 불가

### 3. Static JSON 수동 빌드 필요
- 새 포스트 작성 후 `npm run build:data` 수동 실행 필요
- Dev 서버 hot reload 안됨

---

## 다음 작업

다음 세션에서 구현할 것: **Editor + Dev API Server**
상세 계획은 `docs/EDITOR_IMPLEMENTATION_PLAN.md` 참조
