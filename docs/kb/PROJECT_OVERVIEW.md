# thirdcommit.com - Project Overview

**A personal blog and portfolio platform for sharing technical writing and career reflections**

---

## What Is This?

thirdcommit.com은 Jake Park의 개인 블로그 및 포트폴리오 플랫폼입니다. 주로 커리어 회고와 기술적 인사이트를 공유하며, 진행한 프로젝트들을 소개합니다.

---

## Business Domains

### 1. Blog Domain (블로그)

**목적**: 마크다운 기반 글쓰기 및 발행 플랫폼

#### Core Entities
- **Post (포스트)**: 발행된 블로그 글
  - 메타데이터: 제목, 슬러그, 작성일, 발행일, 상태(draft/published)
  - 콘텐츠: 마크다운 형식 본문
  - 부가정보: 예상 읽기 시간, 설명

#### Use Cases

**UC1: 포스트 목록 조회 (Get Posts)**
- **Actor**: 방문자
- **Description**: 발행된 모든 포스트 목록을 최신순으로 조회
- **Business Rules**:
  - Production 환경: `status === 'published'`인 포스트만 노출
  - Development 환경: draft 포스트도 노출
  - 최신순 정렬 (published_at 기준)

**UC2: 포스트 상세 조회 (Get Post by Slug)**
- **Actor**: 방문자
- **Description**: 특정 포스트의 전체 내용을 조회
- **Business Rules**:
  - 슬러그로 포스트 검색
  - 마크다운 → HTML 변환
  - 코드 블록 문법 강조 (shiki)
  - 헤딩에 자동 ID 부여 (목차 생성용)
  - 존재하지 않는 포스트: 404 처리

**UC3: 포스트 작성/수정 (Save Post)**
- **Actor**: 작성자 (개발 환경 전용)
- **Description**: 새 포스트 작성 또는 기존 포스트 수정
- **Business Rules**:
  - 개발 환경에서만 사용 가능
  - 슬러그 중복 불가
  - 자동 저장 (3초 debounce)
  - 메타데이터 자동 생성 (ULID, 타임스탬프)

**UC4: 포스트 발행 (Publish Post)**
- **Actor**: 작성자
- **Description**: draft 상태의 포스트를 published로 전환
- **Business Rules**:
  - `status`를 'published'로 변경
  - `published_at` 타임스탬프 기록
  - 발행 후 목록에 노출

**UC5: 포스트 삭제 (Delete Post)**
- **Actor**: 작성자 (개발 환경 전용)
- **Description**: 포스트를 완전히 삭제
- **Business Rules**:
  - 개발 환경에서만 사용 가능
  - 파일 시스템에서 영구 삭제

**UC6: Draft 목록 조회 (Get Drafts)**
- **Actor**: 작성자 (개발 환경 전용)
- **Description**: 작성 중인 draft 포스트 목록 조회
- **Business Rules**:
  - `status === 'draft'`인 포스트만 반환

#### Domain Services

**MarkdownService**
- 마크다운 → HTML 변환
- 코드 블록 문법 강조 (shiki)
- 헤딩 자동 ID 부여 (`heading-0`, `heading-1`, ...)
- XSS 방어 (DOMPurify sanitization)

#### Business Policies

**PostVisibilityPolicy**
- Production: draft 포스트 숨김
- Development: 모든 포스트 노출
- 정렬: published_at 기준 최신순

---

### 2. Projects Domain (프로젝트 포트폴리오)

**목적**: 주요 프로젝트 및 작업물 소개

#### Core Entities
- **Project (프로젝트)**: 포트폴리오 항목
  - 기본 정보: 이름, 설명
  - 링크: 외부 URL (GitHub, 배포 URL 등)
  - 상태: 완료/진행중

#### Use Cases

**UC1: 프로젝트 목록 조회 (Get Projects)**
- **Actor**: 방문자
- **Description**: 모든 프로젝트 목록 조회
- **Business Rules**:
  - 정적 데이터 반환 (하드코딩)
  - 순서: 수동 지정 (중요도순)

---

### 3. Reading Experience Domain (독서 경험)

**목적**: 포스트 읽기 환경 최적화

#### Features

**F1: Table of Contents (목차)**
- **Target**: 데스크탑 사용자 (≥1280px)
- **Description**: 포스트의 구조를 한눈에 파악하고 빠르게 이동
- **Components**:
  - 헤딩 계층 구조 표시 (h1, h2, h3)
  - 현재 읽고 있는 섹션 하이라이트
  - 클릭 시 해당 섹션으로 스크롤
  - 포스트 타이틀 포함
- **Business Rules**:
  - 뷰포트 33% 위치 기준으로 액티브 섹션 감지
    - 근거: Eye-tracking 연구 결과 (사용자 시선이 30-40% 위치에 집중)
  - 항상 하나의 헤딩이 하이라이트 (빈 상태 방지)
  - Draft 포스트는 목차 미표시
- **Layout**: `[Spacer 250px] - [Content 700px] - [TOC 250px]`

**F2: Reading Time Estimation (예상 읽기 시간)**
- **Description**: 포스트를 읽는데 걸리는 시간 표시
- **Business Rules**:
  - 평균 읽기 속도 기준 계산
  - 포스트 목록 및 상세 페이지에 표시

**F3: Syntax Highlighting (코드 강조)**
- **Description**: 코드 블록의 가독성 향상
- **Business Rules**:
  - shiki 엔진 사용
  - 다양한 언어 지원
  - 라인 번호 표시

---

## Content Strategy

### 현재 콘텐츠

**Blog Posts** (9편 발행, 한국어)
- "방황을 통과하는 일" 시리즈 (커리어 회고)
- 주제: 커리어 전환, 자기 성찰, 개인 성장
- 타겟: 한국어권 개발자 및 직장인

**Projects**
- DoctorNow (원격 진료 앱, 전 직장)
- The Terminal X (금융용 AI 리서치 에이전트)
- My Feed (WIP: 커스터마이징 가능한 콘텐츠 애그리게이터)

### 발행 워크플로우

```
1. Draft 작성
   ↓
   (Editor에서 작성 또는 markdown 파일 직접 수정)
   ↓
2. 검토 및 수정
   ↓
3. Publish (status를 published로 변경)
   ↓
4. Build & Deploy
   ↓
   (Markdown → HTML → Static JSON → Pre-render → Deploy)
   ↓
5. 공개 (thirdcommit.com에 노출)
```

---

## Data Model

### Post Entity

```typescript
interface Post {
  id: string                    // ULID
  slug: string                  // URL-friendly identifier
  title: string                 // 포스트 제목
  description: string           // SEO 설명
  status: 'draft' | 'published' // 발행 상태
  content: string               // 마크다운 본문
  html?: string                 // 변환된 HTML (빌드 시)
  readingTime?: string          // 예상 읽기 시간
  created_at: string            // ISO 8601 timestamp
  updated_at: string            // ISO 8601 timestamp
  published_at?: string         // ISO 8601 timestamp
}
```

### Project Entity

```typescript
interface Project {
  id: string           // Unique identifier
  name: string         // 프로젝트 이름
  description: string  // 설명
  link: string         // 외부 링크
  status: string       // 상태 (예: 'completed', 'in-progress')
}
```

### TocItem (Reading Experience)

```typescript
interface TocItem {
  level: 0 | 1 | 2 | 3  // 0=title, 1=h1, 2=h2, 3=h3
  text: string          // 헤딩 텍스트
  id: string            // 앵커 ID (heading-0, heading-1, ...)
  children?: TocItem[]  // 중첩된 하위 헤딩 (h3 under h2)
}
```

---

## Domain Rules & Policies

### Post Visibility Rules

```typescript
class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, environment: string): boolean {
    return environment === 'production'
      ? post.status === 'published'
      : true; // dev에서는 draft도 노출
  }
}
```

### Markdown Processing Rules

1. **Heading ID Generation**
   - 모든 h1, h2, h3에 자동으로 ID 부여
   - 형식: `heading-{순서}` (예: heading-0, heading-1)
   - 한글 헤딩도 지원 (slug화 불필요)

2. **Code Highlighting**
   - shiki 엔진 사용
   - 지원 언어: JavaScript, TypeScript, Python, Go, Rust 등

3. **XSS Protection**
   - DOMPurify로 HTML sanitize
   - 안전한 태그만 허용

### TOC Generation Rules

1. **Heading Extraction**
   - h1, h2, h3만 추출 (h4, h5, h6 무시)
   - h3는 부모 h2 아래에 중첩

2. **Active Section Detection**
   - 뷰포트 33% 위치를 기준선으로 설정
   - 기준선을 지나간 마지막 헤딩을 활성화
   - 헤딩이 없으면 첫 번째 헤딩 활성화

3. **Visibility**
   - Desktop (≥1280px): TOC 표시
   - Mobile/Tablet (<1280px): TOC 숨김
   - Draft 포스트: TOC 숨김

---

## Integration Points

### Content Pipeline

```
Markdown File (storage/posts/*.md)
  ↓
[gray-matter] Parse frontmatter
  ↓
[MarkdownService] Convert to HTML
  ├─ [marked] Markdown → HTML
  ├─ [shiki] Code highlighting
  └─ [DOMPurify] XSS protection
  ↓
Static JSON (public/post-{slug}.json)
  ↓
Pre-rendered HTML (dist/posts/{slug}/index.html)
  ↓
Deployed to GitHub Pages
```

### Reading Flow

```
User visits /posts/{slug}
  ↓
Browser loads pre-rendered HTML
  ↓
React hydrates
  ↓
PostDetailPage renders
  ├─ Post content (dangerouslySetInnerHTML)
  └─ TableOfContents (desktop only)
      ├─ Parse HTML for headings
      ├─ Build TOC structure
      ├─ Attach scroll listener
      └─ Update active section
```

---

## Business Metrics & KPIs

### Content Metrics
- 총 발행 포스트 수: 9편
- 평균 읽기 시간: ~5-10분
- 주요 주제: 커리어 회고, 개인 성장

### Engagement Metrics (Future)
- 페이지뷰 (Google Analytics)
- 평균 체류 시간
- 가장 많이 읽힌 포스트
- TOC 클릭률

---

## Domain Evolution

### Completed Features (October 2025)
- ✅ 마크다운 기반 포스트 작성
- ✅ Draft/Published 상태 관리
- ✅ 코드 문법 강조
- ✅ 정적 사이트 생성
- ✅ Desktop TOC with active section highlighting
- ✅ 예상 읽기 시간 계산

### Future Enhancements

**Short-term**
- Mobile TOC (collapsible, bottom sheet)
- Post tagging & categorization
- Related posts suggestion
- Share buttons (Twitter, LinkedIn)

**Mid-term**
- Full-text search (Algolia or local)
- Newsletter subscription
- RSS feed
- Comment system (utterances or giscus)

**Long-term**
- CMS backend (remote editing)
- Multi-language support (i18n)
- Image upload & optimization
- Analytics dashboard

---

## Out of Scope

**Explicitly NOT Supported**:
- User authentication & authorization
- Multi-author support
- Post versioning/revision history
- E-commerce features
- Social networking features
- Real-time collaboration

---

## References

### Domain Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [plans/20251012-002-plan-desktop-post-toc.md](../plans/20251012-002-plan-desktop-post-toc.md) - TOC implementation plan

### Research
- Eye-tracking studies (NN/g, ResearchGate) - TOC active section positioning
- F-pattern reading behavior - Content layout optimization

---

**Last Updated**: October 2025
**Domain Version**: Blog v1.1 (with Desktop TOC)
