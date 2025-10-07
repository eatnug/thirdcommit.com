# 20251007-001-PLAN: Unified Tabbed Interface

**Created**: 2025-10-07
**Status**: PLAN
**Based on**: [docs/specs/20251007-001-spec-unified-tabbed-interface.md](../specs/20251007-001-spec-unified-tabbed-interface.md)

---

## Architecture Design

### Overview

Transform thirdcommit.com from a multi-page architecture (separate `/` and `/blog` pages) into a unified single-page interface with client-side tab navigation. This redesign eliminates the `(with-nav)` route group, consolidates all navigation into a single layout, and implements URL-based tab state management using query parameters.

**Key Architectural Principles**:
- **Server Components for Data**: Fetch all data (projects + posts) server-side for SEO and performance
- **Client Components for Interaction**: Tab switching, URL sync, and user interaction handled client-side
- **Hexagonal Architecture**: New Projects domain mirrors existing Blog domain structure
- **Static Export Compatibility**: All functionality must work with GitHub Pages deployment

### System Components

#### **Component Hierarchy**

```
app/
├── layout.tsx (Root Layout)
│   └── Navigation Header (moved from route group)
│       ├── Home link
│       ├── About tab link (/?tab=about or /)
│       ├── Blog tab link (/?tab=blog)
│       └── Editor link (dev only)
│
├── page.tsx (Unified Homepage - Server Component)
│   ├── Fetch projects via createProjectsApi()
│   ├── Fetch posts via createBlogApi()
│   ├── Parse searchParams for initial tab
│   └── Render <TabsUI> with data
│
└── _components/
    └── tabs/
        ├── tabs-ui.tsx (Client Component)
        │   ├── State: activeTab from URL
        │   ├── useSearchParams() + useRouter()
        │   ├── <TabNavigation> (ARIA tabs)
        │   └── <TabPanel> for About/Blog
        │
        ├── tab-navigation.tsx (Client Component)
        │   ├── ARIA tablist pattern
        │   ├── Keyboard navigation (Arrow keys)
        │   └── Visual active state
        │
        └── tab-panel.tsx (Component)
            └── ARIA tabpanel wrapper

app/_components/
├── projects/
│   ├── project-card.tsx (Component)
│   │   └── Similar to PostCard
│   └── projects-list.tsx (Component)
│       └── Grid of ProjectCards
│
└── blog/
    └── blog-list.tsx (Component)
        └── Reuse existing PostCard
```

#### **Domain Layer Structure**

```
src/domain/projects/              (NEW - mirrors blog structure)
├── entities/
│   └── project.entity.ts
│       └── interface Project { title, description, externalLink? }
├── ports/
│   └── project-repository.port.ts
│       └── interface IProjectRepository { getProjects() }
├── use-cases/
│   └── get-projects.use-case.ts
│       └── getProjectsUseCase(repository)
└── index.ts
    └── createProjectsApi(repository)

src/infrastructure/projects/      (NEW)
└── repositories/
    ├── project.repository.ts
    │   └── getProjectRepository() provider
    └── project.inmemory.repository.ts
        └── class InMemoryProjectRepository
            └── Hardcoded projects array
```

### Data Flow

#### **Initial Page Load (Server-Side)**

```
User visits / or /?tab=blog
  ↓
app/page.tsx (Server Component)
  ├── Read searchParams.tab
  ├── Validate tab value (default: 'about')
  ├── Fetch projects: createProjectsApi(repo).getProjects()
  ├── Fetch posts: createBlogApi(repo).getPosts()
  └── Render <TabsUI initialTab={tab} posts={posts} projects={projects} />
  ↓
Static HTML with BOTH tab contents (SEO-friendly)
  ↓
Browser renders page with correct active tab (no FOUC)
```

#### **Client-Side Tab Switching**

```
User clicks "Blog" tab
  ↓
TabNavigation onClick handler
  ↓
TabsUI.handleTabChange('blog')
  ├── Update URL: router.replace('/?tab=blog', { scroll: false })
  └── State update triggers re-render
  ↓
TabPanel shows/hides via conditional rendering
  ↓
Tab switch completes in <100ms (instant feel)
```

#### **Browser Navigation (Back/Forward)**

```
User presses browser back button
  ↓
URL changes (e.g., /?tab=blog → /)
  ↓
useEffect in TabsUI detects searchParams change
  ↓
setActiveTab(getValidTab(searchParams))
  ↓
Correct tab displays (history works seamlessly)
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ URL Bar: thirdcommit.com/?tab=blog                     │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ Initial Request (SSG)
┌───────────────────────▼─────────────────────────────────────┐
│  Next.js App Router (Server Components)                     │
│                                                              │
│  app/page.tsx                                                │
│    ├─ async searchParams                                    │
│    ├─ getValidTab(searchParams) → 'blog'                    │
│    ├─ Promise.all([                                         │
│    │    createProjectsApi(repo).getProjects()               │
│    │    createBlogApi(repo).getPosts()                      │
│    │  ])                                                     │
│    └─ <Suspense>                                            │
│         <TabsUI initialTab="blog" posts={...} projects={...}/>│
│       </Suspense>                                            │
└─────────────────────┬────────────────────────────────────────┘
                      │ Props down
┌─────────────────────▼────────────────────────────────────────┐
│  Client Components ('use client')                            │
│                                                               │
│  TabsUI                                                       │
│    ├─ const searchParams = useSearchParams()                 │
│    ├─ const router = useRouter()                             │
│    ├─ const [activeTab, setActiveTab] = useState(initialTab) │
│    ├─ useEffect(() => sync state with URL)                   │
│    ├─ handleTabChange(tab) → router.replace()                │
│    └─ Render:                                                │
│         ├─ <TabNavigation activeTab={...} onChange={...} />  │
│         ├�� <TabPanel id="about" isActive={activeTab==='about'}>│
│         │    <ProjectsList projects={projects} />            │
│         │  </TabPanel>                                        │
│         └─ <TabPanel id="blog" isActive={activeTab==='blog'}>│
│              <BlogList posts={posts} />                       │
│            </TabPanel>                                        │
└───────────────────────────────────────────────────────────────┘
                      │ Data from
┌─────────────────────▼────────────────────────────────────────┐
│  Domain Layer (Pure Business Logic)                          │
│                                                               │
│  src/domain/projects/                                         │
│    └─ createProjectsApi(repository)                          │
│         └─ getProjects() → Project[]                         │
│                                                               │
│  src/domain/blog/                                             │
│    └─ createBlogApi(repository)                              │
│         └─ getPosts() → Post[]                               │
│              └─ Applies PostVisibilityPolicy                 │
└───────────────────────┬──────────────────────────────────────┘
                        │ Repository interface
┌───────────────────────▼──────────────────────────────────────┐
│  Infrastructure Layer (Data Sources)                         │
│                                                               │
│  src/infrastructure/projects/                                 │
│    └─ InMemoryProjectRepository                              │
│         └─ getProjects() → Hardcoded array                   │
│                                                               │
│  src/infrastructure/blog/                                     │
│    └─ FileSystemPostRepository                               │
│         └─ Reads markdown files from content/posts/          │
└───────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Projects Domain

#### **Project Entity**

```typescript
// src/domain/projects/entities/project.entity.ts
export interface Project {
  title: string
  description: string
  externalLink?: string
}
```

**Design Notes**:
- Simple entity (no IDs, dates, or slugs needed)
- Optional `externalLink` for projects with live URLs
- No file system backing in MVP (hardcoded data)

#### **Project Repository Port**

```typescript
// src/domain/projects/ports/project-repository.port.ts
import type { Project } from '../entities/project.entity'

export interface IProjectRepository {
  getProjects(): Promise<Project[]>
}
```

#### **Use Case**

```typescript
// src/domain/projects/use-cases/get-projects.use-case.ts
import type { IProjectRepository } from '../ports/project-repository.port'
import type { Project } from '../entities/project.entity'

export async function getProjectsUseCase(
  repository: IProjectRepository
): Promise<Project[]> {
  return repository.getProjects()
}
```

#### **Public API**

```typescript
// src/domain/projects/index.ts
export type { Project } from './entities/project.entity'
export type { IProjectRepository } from './ports/project-repository.port'
export { getProjectsUseCase } from './use-cases/get-projects.use-case'

import type { IProjectRepository } from './ports/project-repository.port'
import { getProjectsUseCase } from './use-cases/get-projects.use-case'

export function createProjectsApi(repository: IProjectRepository) {
  return {
    getProjects: () => getProjectsUseCase(repository)
  }
}
```

#### **In-Memory Repository Implementation**

```typescript
// src/infrastructure/projects/repositories/project.inmemory.repository.ts
import type { IProjectRepository } from '@/domain/projects'
import type { Project } from '@/domain/projects'

export class InMemoryProjectRepository implements IProjectRepository {
  async getProjects(): Promise<Project[]> {
    return [
      {
        title: 'Terminal X',
        description: 'AI research agent for finance professionals. Retrieves news, analyzes market signals, and answers questions',
        externalLink: 'https://theterminalx.com/'
      },
      {
        title: 'DoctorNow',
        description: "South Korea's leading telemedicine app, enabling 24/7 remote doctor consultations and prescription services.",
        externalLink: 'https://www.doctornow.co.kr/'
      },
      {
        title: 'My Feed (WIP)',
        description: 'Fully customizable feed: add any source you follow (YouTube channels, Instagram accounts, blogs) and read everything without distractions.'
      },
      {
        title: 'What should I build next?',
        description: 'Send me an idea.',
        externalLink: 'mailto:jake@thirdcommit.com'
      }
    ]
  }
}
```

#### **Repository Provider**

```typescript
// src/infrastructure/projects/repositories/project.repository.ts
import type { IProjectRepository } from '@/domain/projects'
import { InMemoryProjectRepository } from './project.inmemory.repository'

let instance: IProjectRepository | null = null

export function getProjectRepository(): IProjectRepository {
  if (!instance) {
    instance = new InMemoryProjectRepository()
  }
  return instance
}
```

### Component Props & Types

#### **Tab Types**

```typescript
// app/_components/tabs/types.ts (NEW)
export type TabValue = 'about' | 'blog'

export interface TabConfig {
  value: TabValue
  label: string
  panelId: string
}

export const TABS: TabConfig[] = [
  { value: 'about', label: 'About', panelId: 'panel-about' },
  { value: 'blog', label: 'Blog', panelId: 'panel-blog' }
]

export function getValidTab(searchParams: { tab?: string } | null): TabValue {
  if (!searchParams?.tab) return 'about'
  return searchParams.tab === 'blog' ? 'blog' : 'about'
}
```

#### **TabsUI Props**

```typescript
// app/_components/tabs/tabs-ui.tsx
interface TabsUIProps {
  initialTab: TabValue
  posts: Post[]
  projects: Project[]
}
```

#### **TabNavigation Props**

```typescript
// app/_components/tabs/tab-navigation.tsx
interface TabNavigationProps {
  activeTab: TabValue
  onChange: (tab: TabValue) => void
}
```

#### **TabPanel Props**

```typescript
// app/_components/tabs/tab-panel.tsx
interface TabPanelProps {
  id: string
  isActive: boolean
  children: React.ReactNode
}
```

---

## URL & Routing Strategy

### URL Patterns

| Route | Tab State | Description |
|-------|-----------|-------------|
| `/` | About | Default homepage (no query param) |
| `/?tab=about` | About | Explicit About tab |
| `/?tab=blog` | Blog | Blog tab active |
| `/?tab=invalid` | About | Fallback to default |
| `/blog` | Blog | **Redirects to** `/?tab=blog` (301/meta refresh) |
| `/posts?id={slug}` | N/A | Post detail page (NEW format) |
| `/posts/{slug}` | N/A | **Redirects to** `/posts?id={slug}` (legacy support) |

### Static Export Redirects

**Challenge**: Next.js `redirects()` in `next.config.ts` don't work with `output: 'export'`

**Solution**: Generate static HTML redirect pages post-build

```typescript
// scripts/generate-redirects.ts (NEW)
import fs from 'fs'
import path from 'path'

const redirectTemplate = (destination: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${destination}">
  <link rel="canonical" href="https://thirdcommit.com${destination}" />
  <script>window.location.replace('${destination}');</script>
  <title>Redirecting to ${title}...</title>
</head>
<body>
  <p>Redirecting to <a href="${destination}">${title}</a>...</p>
</body>
</html>
`

// Generate /blog → /?tab=blog redirect
const outDir = path.join(process.cwd(), 'out')
const blogDir = path.join(outDir, 'blog')
fs.mkdirSync(blogDir, { recursive: true })
fs.writeFileSync(
  path.join(blogDir, 'index.html'),
  redirectTemplate('/?tab=blog', 'Blog')
)

console.log('✅ Static redirects generated')
```

**Integration**:
```json
// package.json
{
  "scripts": {
    "export": "NEXT_PUBLIC_STATIC_EXPORT=true next build && tsx scripts/generate-redirects.ts && touch out/.nojekyll && cp public/CNAME out/CNAME"
  }
}
```

### Post URL Migration

**Old Format**: `/posts/[slug]` (dynamic segment)
**New Format**: `/posts?id={slug}` (query parameter)

**Migration Strategy**: Keep both for 6 months (Option A from spec)

```typescript
// app/posts/[slug]/page.tsx (MODIFIED - redirect to new format)
'use client'
import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PostSlugRedirect({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/posts?id=${encodeURIComponent(slug)}`)
  }, [slug, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
```

```typescript
// app/posts/page.tsx (NEW - query param format)
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'

interface PostPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function PostPage({ searchParams }: PostPageProps) {
  const params = await searchParams
  const slug = params.id

  if (!slug) {
    notFound()
  }

  const repository = await getServerPostRepository()
  const blog = createBlogApi(repository)
  const post = await blog.getPost(decodeURIComponent(slug))

  return (
    <Suspense fallback={<PostSkeleton />}>
      <article>
        {/* Existing post content rendering */}
      </article>
    </Suspense>
  )
}
```

---

## Task Breakdown

### Phase 1: Foundation (Domain Layer)

#### **T1: Create Projects Domain Structure**
**Complexity**: S (1-2 hours)
**Description**: Set up Projects domain following hexagonal architecture

**Subtasks**:
- Create directory structure: `src/domain/projects/{entities,ports,use-cases}`
- Create `project.entity.ts` with `Project` interface
- Create `project-repository.port.ts` with `IProjectRepository` interface
- Create `get-projects.use-case.ts` with `getProjectsUseCase` function
- Create `index.ts` with `createProjectsApi` factory function
- Add TypeScript exports and barrel file

**Acceptance Criteria**:
- [ ] AC4: Projects domain structure mirrors Blog domain
- [ ] TR1: Component architecture matches spec
- [ ] TR2: Data models match specification

**Files to Create**:
- `src/domain/projects/entities/project.entity.ts`
- `src/domain/projects/ports/project-repository.port.ts`
- `src/domain/projects/use-cases/get-projects.use-case.ts`
- `src/domain/projects/index.ts`

---

#### **T2: Create Projects Infrastructure Layer**
**Complexity**: S (1 hour)
**Description**: Implement in-memory repository with hardcoded project data

**Dependencies**: T1

**Subtasks**:
- Create directory: `src/infrastructure/projects/repositories/`
- Create `project.inmemory.repository.ts` implementing `IProjectRepository`
- Migrate hardcoded projects from current `app/page.tsx` (Terminal X, DoctorNow, My Feed, etc.)
- Create `project.repository.ts` provider with singleton pattern
- Test repository returns correct data

**Acceptance Criteria**:
- [ ] AC4: InMemoryProjectRepository returns hardcoded array
- [ ] AC4: Repository follows architecture pattern

**Files to Create**:
- `src/infrastructure/projects/repositories/project.inmemory.repository.ts`
- `src/infrastructure/projects/repositories/project.repository.ts`

---

### Phase 2: Tab Infrastructure (Client Components)

#### **T3: Create Tab Utilities and Types**
**Complexity**: S (30 min)
**Description**: Define TypeScript types and utility functions for tab management

**Dependencies**: None

**Subtasks**:
- Create `app/_components/tabs/types.ts`
- Define `TabValue` type (`'about' | 'blog'`)
- Define `TabConfig` interface
- Create `TABS` constant array
- Implement `getValidTab(searchParams)` validation function
- Add unit tests for `getValidTab`

**Acceptance Criteria**:
- [ ] AC2: Tab validation handles invalid values (defaults to 'about')
- [ ] ES1: Invalid tab parameter handling

**Files to Create**:
- `app/_components/tabs/types.ts`

---

#### **T4: Create TabPanel Component**
**Complexity**: S (30 min)
**Description**: Simple wrapper component for ARIA tabpanel pattern

**Dependencies**: None

**Subtasks**:
- Create `app/_components/tabs/tab-panel.tsx`
- Implement ARIA attributes (`role="tabpanel"`, `aria-labelledby`, `id`)
- Use `hidden` attribute for inactive panels (CSS performance optimization)
- Add `tabIndex={0}` for keyboard navigation
- Add focus styling with Tailwind

**Acceptance Criteria**:
- [ ] NFR2: ARIA tabpanel attributes
- [ ] NFR2: Accessible focus indicator

**Files to Create**:
- `app/_components/tabs/tab-panel.tsx`

---

#### **T5: Create TabNavigation Component**
**Complexity**: M (2-3 hours)
**Description**: Accessible tab navigation with keyboard support and ARIA pattern

**Dependencies**: T3

**Subtasks**:
- Create `app/_components/tabs/tab-navigation.tsx` with `'use client'`
- Implement ARIA tablist pattern (roles, aria-selected, aria-controls)
- Implement roving tabindex (active=0, inactive=-1)
- Implement keyboard navigation:
  - Arrow Left/Right: Move focus between tabs
  - Home/End: Jump to first/last tab
  - Enter/Space: Activate focused tab
- Add visual states: active (underline), hover, focus (outline)
- Use Tailwind for styling (no custom CSS)
- Add comprehensive keyboard event handler tests

**Acceptance Criteria**:
- [ ] AC1: Tab navigation behavior (click, hover, focus)
- [ ] NFR2: ARIA Implementation (tablist, roles, aria-selected)
- [ ] NFR2: Keyboard Navigation (Arrow keys, Home/End, Enter/Space)
- [ ] NFR2: Visual Indicators (focus outline, contrast)

**Files to Create**:
- `app/_components/tabs/tab-navigation.tsx`

---

#### **T6: Create TabsUI Orchestrator Component**
**Complexity**: M (2-3 hours)
**Description**: Main client component managing tab state and URL synchronization

**Dependencies**: T3, T4, T5

**Subtasks**:
- Create `app/_components/tabs/tabs-ui.tsx` with `'use client'`
- Implement props interface: `{ initialTab, posts, projects }`
- Use `useSearchParams()` hook (wrap in Suspense in parent)
- Use `useRouter()` for URL updates
- Implement `useState` for active tab (initialized from `initialTab`)
- Implement `useEffect` to sync state with URL changes (back/forward support)
- Implement `handleTabChange` using `router.replace('/?tab=...', { scroll: false })`
- Render TabNavigation + TabPanels
- Prevent scroll jump on tab change
- Add error boundary for client-side errors

**Acceptance Criteria**:
- [ ] AC1: Tab switching without full page refresh
- [ ] AC2: URL synchronization (replace, not push)
- [ ] AC2: Browser back/forward works
- [ ] AC2: Scroll position maintained
- [ ] ES4: Hydration mismatch prevention (initialTab from server)

**Files to Create**:
- `app/_components/tabs/tabs-ui.tsx`

---

### Phase 3: Content Components

#### **T7: Create ProjectCard Component**
**Complexity**: S (1 hour)
**Description**: Display component for individual projects (mirrors PostCard)

**Dependencies**: T1

**Subtasks**:
- Create `app/_components/projects/project-card.tsx`
- Use existing Card primitives (Card, CardHeader, CardTitle, CardDescription)
- Conditionally render external link with icon (lucide-react ExternalLink)
- Add `target="_blank"` and `rel="noopener noreferrer"` for external links
- Handle projects without external links (non-clickable)
- Apply Tailwind styling matching Figma designs
- Make responsive (mobile/desktop)

**Acceptance Criteria**:
- [ ] AC3: Project card shows title, description, external link
- [ ] AC3: External links open in new tab
- [ ] TR4: Reuse existing Card components

**Files to Create**:
- `app/_components/projects/project-card.tsx`

---

#### **T8: Create ProjectsList Component**
**Complexity**: S (1 hour)
**Description**: Grid layout for project cards with empty state

**Dependencies**: T7

**Subtasks**:
- Create `app/_components/projects/projects-list.tsx`
- Implement responsive grid (1 col mobile, 2 col tablet, 2 col desktop per Figma)
- Handle empty state ("No projects yet" message)
- Use Tailwind grid utilities
- Map projects to ProjectCard components
- Add key prop (use title as key since no IDs)

**Acceptance Criteria**:
- [ ] AC3: Projects list displays with all project cards
- [ ] AC3: Layout matches Figma (responsive)
- [ ] ES2: Empty state handling

**Files to Create**:
- `app/_components/projects/projects-list.tsx`

---

#### **T9: Create BlogList Component**
**Complexity**: S (30 min)
**Description**: Wrapper for blog posts using existing PostCard

**Dependencies**: None (reuses existing components)

**Subtasks**:
- Create `app/_components/blog/blog-list.tsx`
- Import existing PostCard from `app/(with-nav)/blog/_components/post-card.tsx`
- Implement responsive grid (matching ProjectsList)
- Handle empty state ("No posts yet")
- Map posts to PostCard components

**Acceptance Criteria**:
- [ ] AC3b: Blog list displays with all post cards
- [ ] AC3b: Reuses existing PostCard component
- [ ] AC5: Uses existing blog domain (no changes)

**Files to Create**:
- `app/_components/blog/blog-list.tsx`

---

### Phase 4: Page Restructuring

#### **T10: Rewrite Unified Homepage**
**Complexity**: L (3-4 hours)
**Description**: Convert `app/page.tsx` to unified interface with server-side data fetching

**Dependencies**: T1, T2, T6, T8, T9

**Subtasks**:
- Backup current `app/page.tsx` and `app/page.css`
- Rewrite `app/page.tsx` as async Server Component
- Accept `searchParams` prop (async in Next.js 15)
- Validate tab with `getValidTab(searchParams)`
- Fetch projects: `createProjectsApi(getProjectRepository()).getProjects()`
- Fetch posts: `createBlogApi(await getServerPostRepository()).getPosts()`
- Use `Promise.all` for parallel fetching
- Wrap TabsUI in `<Suspense fallback={<PageSkeleton />}>`
- Pass `initialTab`, `posts`, `projects` to TabsUI
- Delete `app/page.css`
- Add metadata generation (dynamic title/description based on tab)
- Test SSG build works (`npm run build`)

**Acceptance Criteria**:
- [ ] AC2: Server renders correct initial tab state
- [ ] AC3/AC3b: Both tab contents load correctly
- [ ] AC4: Uses Projects domain API
- [ ] AC5: Uses existing Blog domain API
- [ ] TR1: Server/client boundary correctly implemented
- [ ] TR4: page.css deleted

**Files to Modify**:
- `app/page.tsx` (complete rewrite)

**Files to Delete**:
- `app/page.css`

---

#### **T11: Update Root Layout (Move Navigation)**
**Complexity**: M (1-2 hours)
**Description**: Move navigation header from route group to root layout

**Dependencies**: T10

**Subtasks**:
- Move navigation header from `app/(with-nav)/layout.tsx` to `app/layout.tsx`
- Update navigation links:
  - "Home" → `/` (no query param)
  - "About" → `/?tab=about` (or just `/`)
  - "Blog" → `/?tab=blog`
  - Remove "Tags" link (not in new design)
  - Keep "Editor" link (dev only)
- Add Tailwind footer to root layout
- Test navigation works across all pages (homepage, post detail, editor)
- Ensure dev-only editor link still works

**Acceptance Criteria**:
- [ ] AC7: Editor link visible in dev, hidden in production
- [ ] TR1: Navigation in root layout (not route group)

**Files to Modify**:
- `app/layout.tsx`

**Files to Delete** (after verification):
- `app/(with-nav)/layout.tsx` (consolidated into root)

---

#### **T12: Update Post Detail Page (Query Params)**
**Complexity**: M (2 hours)
**Description**: Migrate post detail from `/posts/[slug]` to `/posts?id={slug}`

**Dependencies**: None (can run in parallel with other tasks)

**Subtasks**:
- Create new `app/posts/page.tsx` (query param version)
- Accept `searchParams` prop (async)
- Read slug via `searchParams.id`
- Handle missing ID (redirect to `/?tab=blog` or 404)
- Decode slug with `decodeURIComponent()`
- Fetch post via `blog.getPost(slug)`
- Reuse existing post rendering logic from `app/(with-nav)/posts/[slug]/page.tsx`
- Wrap in Suspense boundary
- Add "Back" button using `router.back()`
- Update PostCard link to use `/posts?id={slug}` format
- Encode slug in PostCard: `encodeURIComponent(post.slug)`
- Test navigation: Blog tab → Post detail → Back button

**Acceptance Criteria**:
- [ ] AC6: Post detail URL is `/posts?id={slug}`
- [ ] AC6: Browser back button works correctly
- [ ] AC6: Slug encoding/decoding handles special characters
- [ ] ES4: Query parameter routing works in static export

**Files to Create**:
- `app/posts/page.tsx` (NEW query param version)

**Files to Modify**:
- `app/(with-nav)/blog/_components/post-card.tsx` (update link format)

---

#### **T13: Create Legacy Post URL Redirect**
**Complexity**: S (1 hour)
**Description**: Redirect old `/posts/[slug]` URLs to new format

**Dependencies**: T12

**Subtasks**:
- Modify `app/posts/[slug]/page.tsx` to client-side redirect component
- Use `use(params)` to unwrap async params
- Use `useRouter().replace()` to redirect to `/posts?id={slug}`
- Add loading state during redirect
- Test old URLs redirect correctly
- Consider: Generate 404 page after 6 months to deprecate old format

**Acceptance Criteria**:
- [ ] AC6: Old `/posts/{slug}` redirects to `/posts?id={slug}`
- [ ] AC8: Legacy URL support (client-side redirect)

**Files to Modify**:
- `app/posts/[slug]/page.tsx` (convert to redirect)

---

### Phase 5: Static Export & Redirects

#### **T14: Create Redirect Generation Script**
**Complexity**: S (1 hour)
**Description**: Generate static HTML redirects for `/blog` → `/?tab=blog`

**Dependencies**: T10

**Subtasks**:
- Create `scripts/generate-redirects.ts`
- Implement `redirectTemplate()` function (meta refresh + JS fallback)
- Generate redirect for `/blog` → `/?tab=blog`
- Write HTML file to `out/blog/index.html`
- Add canonical link for SEO
- Test redirect works after build
- Update `package.json` export script to run redirect generation

**Acceptance Criteria**:
- [ ] AC8: `/blog` redirects to `/?tab=blog`
- [ ] ES4: Static export redirects work (meta refresh)
- [ ] NFR3: 301-equivalent for static export (meta + canonical)

**Files to Create**:
- `scripts/generate-redirects.ts`

**Files to Modify**:
- `package.json` (update export script)

---

#### **T15: Test Static Export Build**
**Complexity**: M (1-2 hours)
**Description**: Verify complete static export works correctly

**Dependencies**: T10, T11, T12, T13, T14

**Subtasks**:
- Run `npm run export`
- Verify build completes without errors
- Verify `out/` directory structure is correct
- Test locally with `npx serve out`
- Test routes:
  - `/` (About tab active)
  - `/?tab=blog` (Blog tab active)
  - `/blog/` (redirects to `/?tab=blog`)
  - `/posts?id={slug}` (post detail loads)
  - `/posts/{slug}/` (redirects to query param version)
- Test browser back/forward navigation
- Test deep linking (bookmark `/?tab=blog`, reopen)
- Verify no console errors
- Check bundle size increase (<50KB per NFR1)

**Acceptance Criteria**:
- [ ] NFR1: Static build completes successfully
- [ ] NFR1: Bundle size increase <50KB
- [ ] AC2: All URL patterns work correctly
- [ ] ES4: Static export deployed correctly

---

### Phase 6: Styling & Responsive Design

#### **T16: Implement Responsive Layouts**
**Complexity**: M (2-3 hours)
**Description**: Apply Tailwind responsive utilities to match Figma designs

**Dependencies**: T7, T8, T9

**Subtasks**:
- Review Figma designs (web + mobile for projects and posts)
- Update ProjectsList grid:
  - Mobile (<768px): 1 column
  - Tablet (768px-1024px): 2 columns
  - Desktop (>1024px): 2 columns (per Figma)
- Update BlogList grid (same breakpoints)
- Update TabNavigation for mobile (horizontal scroll if needed)
- Ensure tab touch targets are 44x44px minimum
- Test on physical devices (iOS Safari, Chrome Mobile)
- Test portrait/landscape orientation changes
- Test 200% zoom accessibility requirement

**Acceptance Criteria**:
- [ ] NFR4: Responsive design (mobile, tablet, desktop)
- [ ] NFR4: Touch targets minimum 44x44px
- [ ] NFR4: Layout adapts on device rotation
- [ ] NFR4: Functional at 200% zoom

**Files to Modify**:
- `app/_components/projects/projects-list.tsx`
- `app/_components/blog/blog-list.tsx`
- `app/_components/tabs/tab-navigation.tsx`

---

#### **T17: Implement Visual Design Polish**
**Complexity**: M (2 hours)
**Description**: Match Figma visual design specifications exactly

**Dependencies**: T5, T16

**Subtasks**:
- Apply exact spacing, colors, typography from Figma
- Implement active tab visual indicator (underline + color)
- Implement hover states (subtle color transition)
- Implement focus indicator (2px visible outline, 3:1 contrast)
- Ensure text contrast meets WCAG 4.5:1 ratio
- Use Tailwind design tokens (`text-foreground`, `bg-card`, etc.)
- Add smooth transitions for hover/focus (no tab switch animation in MVP)
- Test in high contrast mode (Windows)
- Test with forced colors mode
- Verify Safari-specific styling (backdrop-filter, etc.)

**Acceptance Criteria**:
- [ ] NFR2: Focus indicator visible (2px outline)
- [ ] NFR2: Color contrast meets 4.5:1 ratio
- [ ] AC3/AC3b: Layout matches Figma web/mobile designs
- [ ] ES7: High contrast mode support

**Files to Modify**:
- `app/_components/tabs/tab-navigation.tsx`
- `app/_components/projects/project-card.tsx`

---

### Phase 7: Accessibility & Testing

#### **T18: ARIA Screen Reader Testing**
**Complexity**: M (2-3 hours)
**Description**: Test and fix screen reader accessibility

**Dependencies**: T5, T6

**Subtasks**:
- Test with VoiceOver (macOS/iOS):
  - Tab navigation announces correctly ("About, tab, 1 of 2, selected")
  - Tab panels announce relationship to tabs
  - Content changes announced via aria-live
- Test with NVDA (Windows):
  - Same as VoiceOver tests
  - Verify browse/focus mode behavior
- Add `aria-live="polite"` region for tab content changes (if needed)
- Ensure all interactive elements have accessible names
- Test keyboard-only navigation flow
- Document screen reader usage in comments
- Fix any announced issues

**Acceptance Criteria**:
- [ ] NFR2: Screen reader announces tab name and state
- [ ] NFR2: Content changes announced
- [ ] NFR2: All elements have accessible names
- [ ] ES7: Screen reader announces tab switches

**Files to Modify**:
- `app/_components/tabs/tabs-ui.tsx` (add aria-live if needed)
- `app/_components/tabs/tab-navigation.tsx` (ensure complete ARIA)

---

#### **T19: Keyboard Navigation Testing**
**Complexity**: S (1 hour)
**Description**: Comprehensive keyboard navigation testing and fixes

**Dependencies**: T5, T6

**Subtasks**:
- Test Tab key navigation (focus moves correctly)
- Test Arrow Left/Right (moves between tabs)
- Test Home/End keys (jump to first/last tab)
- Test Enter/Space (activates focused tab)
- Test Escape key behavior (if applicable)
- Verify focus order is logical
- Verify focus is visible at all times
- Test with keyboard-only users (no mouse)
- Create keyboard navigation documentation

**Acceptance Criteria**:
- [ ] AC1: Arrow key navigation works
- [ ] NFR2: Roving tabindex pattern
- [ ] NFR2: Enter/Space activate tabs
- [ ] ES7: Keyboard navigation fully functional

---

#### **T20: Lighthouse & Performance Audit**
**Complexity**: M (2 hours)
**Description**: Run Lighthouse audits and optimize for Core Web Vitals

**Dependencies**: T15, T16, T17

**Subtasks**:
- Run Lighthouse on `/` (About tab):
  - Target: >90 Performance, Accessibility, Best Practices, SEO
- Run Lighthouse on `/?tab=blog` (Blog tab)
- Fix any accessibility violations
- Optimize images (if applicable)
- Verify First Contentful Paint (FCP) <1.5s
- Verify Largest Contentful Paint (LCP) <2.5s
- Verify Cumulative Layout Shift (CLS) = 0
- Verify Time to Interactive (TTI) <3.5s
- Test tab switching perceived latency (<100ms)
- Document performance metrics

**Acceptance Criteria**:
- [ ] NFR1: FCP <1.5s, TTI <3.5s, LCP <2.5s, CLS ~0
- [ ] NFR1: Tab switching <100ms perceived latency
- [ ] AC1: Tab transition feels instant

**Metrics to Capture**:
- Lighthouse scores (all categories)
- Core Web Vitals (LCP, FID, CLS)
- Bundle size before/after

---

#### **T21: Cross-Browser Testing**
**Complexity**: M (2 hours)
**Description**: Test on all major browsers and document compatibility

**Dependencies**: T15, T16, T17

**Subtasks**:
- Test Chrome (latest 2 versions):
  - Tab navigation, URL sync, keyboard, responsiveness
- Test Firefox (latest 2 versions):
  - Same tests as Chrome
- Test Safari (latest 2 versions):
  - Pay attention to webkit-specific issues
- Test Edge (latest 2 versions):
  - Verify Chromium-based Edge works
- Test iOS Safari (iOS 15+):
  - Touch interactions, orientation changes
- Test Chrome Mobile (Android 12+):
  - Touch interactions, mobile viewport
- Test with JavaScript disabled (graceful degradation)
- Test in private/incognito mode
- Document any browser-specific bugs

**Acceptance Criteria**:
- [ ] NFR5: Chrome, Firefox, Safari, Edge compatibility
- [ ] NFR5: iOS Safari and Chrome Mobile work
- [ ] NFR5: JavaScript disabled shows default tab
- [ ] NFR5: Private mode works

**Files to Modify** (if needed):
- Browser-specific CSS fallbacks

---

#### **T22: axe DevTools Accessibility Audit**
**Complexity**: S (1 hour)
**Description**: Run axe DevTools and fix violations

**Dependencies**: T18, T19

**Subtasks**:
- Install axe DevTools browser extension
- Run full page scan on `/`
- Run full page scan on `/?tab=blog`
- Fix all critical and serious violations
- Document moderate violations (if acceptable)
- Re-run scan to verify 0 violations
- Test with color blindness simulators
- Test with high contrast themes

**Acceptance Criteria**:
- [ ] NFR2: axe DevTools reports 0 violations
- [ ] ES7: High contrast mode functional

---

### Phase 8: SEO & Metadata

#### **T23: Implement Dynamic Metadata**
**Complexity**: M (1-2 hours)
**Description**: Generate different metadata per tab for SEO

**Dependencies**: T10

**Subtasks**:
- Implement `generateMetadata()` in `app/page.tsx`
- Read `searchParams.tab` to determine active tab
- About tab metadata:
  - Title: "Jake Park - Software Engineer"
  - Description: "Software engineer. Desperately trying to keep up with this big, disruptive wave of innovation."
- Blog tab metadata:
  - Title: "Blog - Jake Park"
  - Description: "Articles about software engineering, AI, and vibe-coding experiments."
- Set canonical URL:
  - About: `https://thirdcommit.com/`
  - Blog: `https://thirdcommit.com/?tab=blog`
- Add Open Graph tags (og:title, og:description, og:url, og:image)
- Test metadata with Facebook Sharing Debugger and Twitter Card Validator

**Acceptance Criteria**:
- [ ] NFR3: Different title/description per tab
- [ ] NFR3: Canonical URLs set correctly
- [ ] NFR3: Open Graph tags differ per tab

**Files to Modify**:
- `app/page.tsx` (add generateMetadata)

---

#### **T24: Generate Sitemap**
**Complexity**: S (1 hour)
**Description**: Create sitemap.xml with both tab URLs

**Dependencies**: T10

**Subtasks**:
- Create `app/sitemap.ts` (Next.js sitemap generation)
- Include URLs:
  - `https://thirdcommit.com/` (priority: 1.0)
  - `https://thirdcommit.com/?tab=blog` (priority: 0.9)
  - All `/posts?id={slug}` URLs (priority: 0.8)
- Set changefreq and lastmod
- Verify no duplicate canonicals
- Test sitemap validates at `sitemap.xml` route
- Submit to Google Search Console

**Acceptance Criteria**:
- [ ] NFR3: Sitemap includes both tab URLs
- [ ] NFR3: No duplicate content (different canonicals)

**Files to Create**:
- `app/sitemap.ts`

---

#### **T25: Structured Data (JSON-LD)**
**Complexity**: S (1 hour)
**Description**: Add schema.org structured data for person and blog

**Dependencies**: T10

**Subtasks**:
- Add JSON-LD script tag in About tab:
  - Schema type: Person
  - Name: Jake Park
  - JobTitle: Software Engineer
  - URL, sameAs links (LinkedIn, GitHub, etc.)
- Add JSON-LD in Blog tab:
  - Schema type: Blog
  - BlogPosting array with post metadata
- Validate with Google Rich Results Test
- Verify no errors in Search Console

**Acceptance Criteria**:
- [ ] NFR3: Valid schema.org JSON-LD

**Files to Modify**:
- `app/page.tsx` or `app/layout.tsx`

---

### Phase 9: Edge Cases & Error Handling

#### **T26: Handle Empty States**
**Complexity**: S (30 min)
**Description**: Test and verify empty state handling

**Dependencies**: T8, T9

**Subtasks**:
- Temporarily modify repositories to return empty arrays
- Verify "No projects yet" displays correctly
- Verify "No posts yet" displays correctly
- Check styling of empty states
- Restore real data
- Document empty state behavior

**Acceptance Criteria**:
- [ ] ES2: Projects empty state
- [ ] ES2: Posts empty state

---

#### **T27: Handle Invalid Slugs & Missing IDs**
**Complexity**: S (1 hour)
**Description**: Test error scenarios in post detail page

**Dependencies**: T12

**Subtasks**:
- Test `/posts?id=nonexistent-slug` (should 404)
- Test `/posts` without ID (should redirect or show error)
- Test special characters in slugs (encoding)
- Add error boundary for post detail page
- Add user-friendly 404 page
- Test network errors (build-time failure)

**Acceptance Criteria**:
- [ ] ES2: Invalid slug shows 404
- [ ] ES2: Missing slug handled gracefully
- [ ] AC6: Special character encoding works

**Files to Modify**:
- `app/posts/page.tsx` (add error handling)

**Files to Create**:
- `app/posts/not-found.tsx` (custom 404)

---

#### **T28: Test URL Edge Cases**
**Complexity**: S (1 hour)
**Description**: Test URL parameter conflicts and edge cases

**Dependencies**: T6, T12

**Subtasks**:
- Test multiple tab params: `/?tab=blog&tab=about` (should use first)
- Test extra query params: `/?tab=blog&utm_source=twitter` (should preserve analytics params)
- Test post detail with unrelated params: `/posts?id=x&foo=bar` (should ignore)
- Test URL encoding edge cases (emoji slugs, spaces, special chars)
- Test very long query strings (browser limits)
- Document URL handling behavior

**Acceptance Criteria**:
- [ ] ES6: Multiple tab params (first occurrence used)
- [ ] ES6: Unrelated params preserved
- [ ] AC6: URL encoding/decoding robust

---

#### **T29: Test Browser History Edge Cases**
**Complexity**: M (1-2 hours)
**Description**: Comprehensive history navigation testing

**Dependencies**: T6, T12

**Subtasks**:
- Test sequence: About → Blog → About → Back → Back (should return to About)
- Test: Blog → Post detail → Back (should return to Blog tab, not About)
- Test: About → Post detail → Back (complex, but should handle)
- Test: Multiple tab switches → Back multiple times
- Test: Bookmark `/?tab=blog` → Navigate away → Return (should restore Blog)
- Test: Forward button after back navigation
- Document expected behavior for each scenario
- Fix any state desync issues

**Acceptance Criteria**:
- [ ] ES5: Multiple tab switches history
- [ ] ES5: Post → Back returns to correct tab
- [ ] ES5: Bookmarks restore exact state

---

#### **T30: Mobile Device Edge Cases**
**Complexity**: S (1 hour)
**Description**: Test mobile-specific edge cases

**Dependencies**: T16, T21

**Subtasks**:
- Test on iOS with keyboard open (viewport resize)
- Test on small screens (<320px width, e.g., Galaxy Fold)
- Test iOS safe area insets (notch overlap)
- Test Android back button behavior
- Test pull-to-refresh interaction
- Test mobile browser address bar auto-hide
- Document mobile quirks and fixes

**Acceptance Criteria**:
- [ ] ES8: Mobile keyboard resize handled
- [ ] ES8: Small screens (<320px) functional
- [ ] ES8: iOS safe area respected

---

### Phase 10: Cleanup & Documentation

#### **T31: Remove Old Route Group**
**Complexity**: S (1 hour)
**Description**: Clean up deprecated `(with-nav)` route group

**Dependencies**: T11, T12, T13

**Subtasks**:
- Verify all functionality migrated from `(with-nav)` route group
- Delete `app/(with-nav)/layout.tsx` (navigation moved to root)
- Delete `app/(with-nav)/blog/page.tsx` (replaced by unified page)
- Optionally move `PostCard` to `app/_components/blog/`
- Update all import paths referencing old locations
- Run build to verify no broken imports
- Commit cleanup separately for easy rollback

**Acceptance Criteria**:
- [ ] TR1: Route group removed
- [ ] No broken imports

**Files to Delete**:
- `app/(with-nav)/layout.tsx`
- `app/(with-nav)/blog/page.tsx`

**Files to Move** (optional):
- `app/(with-nav)/blog/_components/post-card.tsx` → `app/_components/blog/post-card.tsx`

---

#### **T32: Update Documentation**
**Complexity**: S (1 hour)
**Description**: Document new architecture and usage

**Dependencies**: T31

**Subtasks**:
- Update `README.md` (if architecture section exists)
- Document tab navigation pattern
- Document Projects domain usage
- Update build/deploy instructions (if changed)
- Add migration guide for contributors
- Document accessibility features
- Add troubleshooting section (common issues)

**Acceptance Criteria**:
- [ ] Documentation reflects new architecture

**Files to Modify**:
- `README.md` (if applicable)

---

#### **T33: Final Integration Test**
**Complexity**: M (1-2 hours)
**Description**: End-to-end manual testing of complete feature

**Dependencies**: ALL previous tasks

**Subtasks**:
- Test complete user journey:
  1. Visit `/` → About tab active
  2. Click "Blog" tab → Blog tab active, URL updates
  3. Click post → Post detail loads
  4. Press back → Returns to Blog tab
  5. Press back → Returns to About tab
  6. Refresh page → Correct tab persists
- Test with keyboard only (no mouse)
- Test with screen reader
- Test on mobile device
- Test in production-like environment (`npm run export` → serve)
- Verify no console errors or warnings
- Verify no broken links
- Verify all images load
- Check Google Analytics tracking (if applicable)

**Acceptance Criteria**:
- [ ] ALL acceptance criteria from spec verified
- [ ] No regressions in existing functionality
- [ ] Ready for production deployment

---

## Task Dependencies & Execution Plan

### Dependency Graph

```
Foundation (Domain)
├─ T1 (Projects Domain) → T2 (Projects Infrastructure)
│                            └─ T10 (Unified Homepage)
│
Tab Infrastructure
├─ T3 (Types) → T5 (TabNavigation) → T6 (TabsUI)
├─ T4 (TabPanel) ─────────────────┘
│
Content Components
├─ T1 → T7 (ProjectCard) → T8 (ProjectsList) ──┐
├─ T9 (BlogList) ─────────────────────────────────┤
│                                                  │
Page Restructuring                                │
├─ T2, T6, T8, T9 → T10 (Unified Homepage) ──────┤
├─ T10 → T11 (Root Layout) ──────────────────────┤
├─ T12 (Post Detail Query) → T13 (Legacy Redirect)┤
│                                                  │
Static Export                                      │
├─ T10 → T14 (Redirect Script) ──────────────────┤
├─ T10, T11, T12, T13, T14 → T15 (Test Export) ─┤
│                                                  │
Styling                                            │
├─ T7, T8, T9 → T16 (Responsive) ────────────────┤
├─ T5, T16 → T17 (Visual Polish) ────────────────┤
│                                                  │
Testing                                            │
├─ T5, T6 → T18 (Screen Reader) ─────────────────┤
├─ T5, T6 → T19 (Keyboard) ──────────────────────┤
├─ T15, T16, T17 → T20 (Lighthouse) ─────────────┤
├─ T15, T16, T17 → T21 (Cross-Browser) ──────────┤
├─ T18, T19 → T22 (axe DevTools) ────────────────┤
│                                                  │
SEO                                                │
├─ T10 → T23 (Metadata) ─────────────────────────┤
├─ T10 → T24 (Sitemap) ──────────────────────────┤
├─ T10 → T25 (Structured Data) ──────────────────┤
│                                                  │
Edge Cases                                         │
├─ T8, T9 → T26 (Empty States) ──────────────────┤
├─ T12 → T27 (Invalid Slugs) ────────────────────┤
├─ T6, T12 → T28 (URL Edge Cases) ───────────────┤
├─ T6, T12 → T29 (History Edge Cases) ───────────┤
├─ T16, T21 → T30 (Mobile Edge Cases) ───────────┤
│                                                  │
Cleanup                                            │
├─ T11, T12, T13 → T31 (Remove Route Group) ─────┤
├─ T31 → T32 (Documentation) ────────────────────┤
└─ ALL → T33 (Final Integration Test)
```

### Execution Sequence

#### **Sprint 1: Foundation** (3-4 hours)
Run in parallel:
- **Stream A**: T1 → T2 (Domain + Infrastructure)
- **Stream B**: T3, T4 (Types + TabPanel)

#### **Sprint 2: Core Components** (4-5 hours)
Sequential:
- T5 (TabNavigation)
- T6 (TabsUI)

Run in parallel:
- **Stream A**: T7 → T8 (ProjectCard → ProjectsList)
- **Stream B**: T9 (BlogList)

#### **Sprint 3: Page Restructuring** (5-7 hours)
Sequential (critical path):
- T10 (Unified Homepage)
- T11 (Root Layout)

Run in parallel:
- **Stream A**: T12 → T13 (Post Detail + Legacy Redirect)
- **Stream B**: T14 (Redirect Script)

Then:
- T15 (Test Static Export)

#### **Sprint 4: Styling** (4-5 hours)
Sequential:
- T16 (Responsive Layouts)
- T17 (Visual Polish)

#### **Sprint 5: Accessibility Testing** (6-8 hours)
Run in parallel:
- **Stream A**: T18 (Screen Reader)
- **Stream B**: T19 (Keyboard)

Then run in parallel:
- **Stream A**: T20 (Lighthouse)
- **Stream B**: T21 (Cross-Browser)

Finally:
- T22 (axe DevTools)

#### **Sprint 6: SEO** (3-4 hours)
Run in parallel:
- T23 (Metadata)
- T24 (Sitemap)
- T25 (Structured Data)

#### **Sprint 7: Edge Cases** (4-6 hours)
Run in parallel:
- T26 (Empty States)
- T27 (Invalid Slugs)
- T28 (URL Edge Cases)
- T29 (History Edge Cases)
- T30 (Mobile Edge Cases)

#### **Sprint 8: Cleanup** (3-4 hours)
Sequential:
- T31 (Remove Route Group)
- T32 (Documentation)
- T33 (Final Integration Test)

### Parallel Opportunities

**Maximum Parallelism** (if 2 developers):
- Sprint 1: 2 streams (Domain + Client components)
- Sprint 2: 2 streams (Cards in parallel)
- Sprint 3: 2 streams (Post detail + Redirects)
- Sprint 5: 2 streams (A11y + Performance)
- Sprint 6: 3 streams (all SEO tasks independent)
- Sprint 7: 5 streams (all edge case tests independent)

### Critical Path

**Longest Sequential Path** (~20-25 hours):
```
T1 → T2 → T5 → T6 → T10 → T11 → T15 → T16 → T17 → T20 → T22 → T31 → T33
```

**Estimated Timeline**:
- **Sequential execution**: ~60 hours
- **With parallelism (2 devs)**: ~30-35 hours
- **Solo optimal**: ~40-45 hours (parallel tasks done sequentially but optimized order)

---

## Technology Stack

### No New Dependencies Required

All required functionality is available with existing dependencies:
- **React 19** - Server/Client Components
- **Next.js 15.5** - App Router, Static Export, searchParams
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icons (ExternalLink)
- **Class Variance Authority + clsx** - Conditional classes
- **TypeScript** - Type safety

### Scripts to Add

```json
// package.json - UPDATE export script
{
  "scripts": {
    "export": "NEXT_PUBLIC_STATIC_EXPORT=true next build && tsx scripts/generate-redirects.ts && touch out/.nojekyll && cp public/CNAME out/CNAME"
  }
}
```

---

## Risks & Mitigations

### Risk 1: Static Export Query Parameter Routing

**Risk**: GitHub Pages doesn't support server-side routing; query params might not work as expected

**Likelihood**: Medium
**Impact**: High

**Mitigation**:
- Client-side routing with `useSearchParams()` works in static export
- Test early in T15 (Test Static Export Build)
- Fallback: Use hash-based routing (`#about`, `#blog`) if query params fail
- Existing site uses static export, so pattern is proven

**Tests**:
- [ ] T15: Verify `/?tab=blog` works after `npm run export`
- [ ] T15: Test deep linking with bookmarks
- [ ] T15: Test browser back/forward

---

### Risk 2: Hydration Mismatch (Server vs Client State)

**Risk**: Server renders About tab, client reads `?tab=blog` from URL, causing FOUC or error

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Pass `initialTab` from server to client (T10, T6)
- Server reads `searchParams` and renders correct tab in HTML
- Client uses same `initialTab` for useState initialization
- Prevents mismatch on first render

**Tests**:
- [ ] T10: Verify no hydration errors in console
- [ ] T15: Test with React DevTools (no hydration warnings)

---

### Risk 3: SEO Impact from URL Changes

**Risk**: Changing `/blog` to `/?tab=blog` could lose search rankings

**Likelihood**: Low
**Impact**: High

**Mitigation**:
- Implement proper redirects (T14: 301-equivalent via meta refresh + canonical)
- Keep old post URLs with redirects (T13: 6-month support)
- Submit new sitemap to Google Search Console (T24)
- Monitor Search Console for crawl errors post-launch
- Canonical tags point to new URLs (T23)

**Tests**:
- [ ] T14: Verify redirect has canonical link
- [ ] T23: Verify canonical URLs set correctly
- [ ] Post-launch: Monitor Google Search Console for 2 weeks

---

### Risk 4: Accessibility Regressions

**Risk**: New tab pattern introduces A11y issues not caught in testing

**Likelihood**: Low
**Impact**: Medium

**Mitigation**:
- Follow W3C ARIA Tabs pattern exactly (T5)
- Comprehensive screen reader testing (T18)
- Automated axe DevTools scan (T22)
- Lighthouse A11y audit (T20)
- Manual keyboard testing (T19)

**Tests**:
- [ ] T22: axe DevTools 0 violations
- [ ] T18: VoiceOver + NVDA testing passes
- [ ] T20: Lighthouse A11y score >95

---

### Risk 5: Browser Compatibility Issues

**Risk**: Tab navigation breaks on older browsers or Safari quirks

**Likelihood**: Low
**Impact**: Medium

**Mitigation**:
- Use standard Web APIs (no experimental features)
- `useSearchParams` and `useRouter` are stable Next.js APIs
- Test on Safari early (known for webkit quirks)
- Progressive enhancement: HTML contains both tab contents (works without JS)

**Tests**:
- [ ] T21: Test Safari (macOS + iOS)
- [ ] T21: Test with JS disabled (content still visible)

---

## Success Metrics

### User Experience Metrics

- [ ] **Tab Switching Speed**: <100ms perceived latency (user can't detect delay)
- [ ] **Browser Navigation**: Back/forward buttons work intuitively (no broken history)
- [ ] **Deep Linking**: Shareable URLs work (`/?tab=blog` opens correct tab)
- [ ] **No FOUC**: Initial render shows correct tab (no flash)

### Performance Metrics

- [ ] **Lighthouse Scores**: >90 in all categories (Performance, A11y, Best Practices, SEO)
- [ ] **Core Web Vitals**:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1 (target: 0)
- [ ] **Build Time**: Increase <10% vs current
- [ ] **Bundle Size**: Increase <50KB vs current

### Accessibility Metrics

- [ ] **axe DevTools**: 0 violations
- [ ] **Screen Reader**: VoiceOver + NVDA tests pass (all content accessible)
- [ ] **Keyboard Navigation**: 100% functional without mouse
- [ ] **WCAG 2.1 Level AA**: All criteria met

### SEO Metrics

- [ ] **Search Console**: No 404 spike in first 2 weeks post-launch
- [ ] **Indexing**: Both tabs indexed separately (verify in Google)
- [ ] **Search Traffic**: Stable or improved (monitor for 4 weeks)
- [ ] **Structured Data**: Valid JSON-LD (no Rich Results Test errors)

### Development Metrics

- [ ] **Test Coverage**: All AC from spec verified
- [ ] **Code Quality**: No ESLint errors, TypeScript strict mode passes
- [ ] **Documentation**: Architecture documented, migration guide exists
- [ ] **Build Success**: `npm run export` completes without errors

---

## Out of Scope

### Explicitly Excluded from This Implementation

- ❌ **Tags Feature**: Not implemented (removed from navigation per design)
- ❌ **Filesystem-Based Projects**: Use hardcoded array (no markdown files)
- ❌ **Project Metadata**: No reading time, dates, or detailed tracking for projects
- ❌ **Mobile Dropdown Navigation**: Tabs remain horizontal (scroll if needed)
- ❌ **Blog Domain Changes**: No modifications to `src/domain/blog/` or `src/infrastructure/blog/`
- ❌ **Editor Functionality**: No changes to `/editor` page or components
- ❌ **Tab Transition Animations**: No smooth animations for tab switches (instant only)
- ❌ **Tab State Persistence**: No localStorage (user preference not saved)
- ❌ **Swipe Gestures**: No touch swipe to switch tabs (click/tap only)

### Deferred to Future Iterations

- 🔮 **Animated Transitions**: Smooth fade/slide transitions between tabs
- 🔮 **Project Markdown Files**: Migrate from hardcoded to file-based like posts
- 🔮 **Search/Filter**: Search bar for projects and posts
- 🔮 **Tab Memory**: Remember user's last active tab in localStorage
- 🔮 **Analytics**: Track tab engagement metrics
- 🔮 **Dark Mode**: Theme switching (if not already implemented)
- 🔮 **RSS Feed**: Separate feeds for blog posts
- 🔮 **Related Posts**: Show related posts in post detail
- 🔮 **Pagination**: If project/post count grows significantly

---

## Definition of Done

### Feature Completion Checklist

- [ ] All 33 tasks completed (T1-T33)
- [ ] All acceptance criteria from spec verified (200+ AC items)
- [ ] All non-functional requirements met (performance, A11y, SEO, responsive)
- [ ] All technical requirements implemented (architecture, data models, APIs)

### Quality Assurance

- [ ] Lighthouse score >90 (all categories)
- [ ] axe DevTools reports 0 accessibility violations
- [ ] Screen reader testing passed (VoiceOver + NVDA)
- [ ] Keyboard navigation fully functional
- [ ] Cross-browser testing passed (Chrome, Safari, Firefox, Edge)
- [ ] Mobile testing passed (iOS Safari, Chrome Mobile)

### Build & Deploy

- [ ] Static export builds successfully (`npm run export`)
- [ ] No console errors or warnings
- [ ] Bundle size increase <50KB vs current
- [ ] Redirects tested and working
- [ ] Deployed to GitHub Pages (production)

### Testing & Validation

- [ ] No regressions in existing blog/editor functionality
- [ ] Post detail page works with new URL format
- [ ] Legacy URLs redirect correctly
- [ ] Browser history navigation works (back/forward)
- [ ] Deep linking works (bookmarks, shared links)

### Documentation & Handoff

- [ ] Code reviewed (self-review against architecture principles)
- [ ] Documentation updated (README, migration guide)
- [ ] SEO updates submitted (sitemap to Google Search Console)
- [ ] Success metrics captured (Lighthouse, bundle size, etc.)
- [ ] Stakeholder approval (if applicable)

---

## Next Steps

### Immediate Actions

1. **Review This Plan**: Validate task breakdown and dependencies
2. **Set Up Environment**: Ensure dev environment ready (`npm install`, `npm run dev`)
3. **Create Feature Branch**: `git checkout -b feature/unified-tabbed-interface`
4. **Start Sprint 1**: Begin with T1 (Projects Domain Structure)

### Recommended Execution Strategy

**Solo Developer** (40-45 hours total):
- Work in sprint order (Foundation → Core → Testing)
- Complete one sprint before moving to next
- Test incrementally (don't wait until end)
- Commit after each task completion (easy rollback)

**Two Developers** (30-35 hours total):
- **Dev A**: Focus on domain/infrastructure (T1, T2, T10, T11)
- **Dev B**: Focus on client components (T3-T9)
- Sync after Sprint 2, pair on complex tasks (T18-T22)
- Divide edge case testing (Sprint 7)

### First Session Goals

- [ ] Complete T1 (Projects Domain) - 1-2 hours
- [ ] Complete T2 (Projects Infrastructure) - 1 hour
- [ ] Complete T3 (Tab Types) - 30 min
- [ ] Start T5 (TabNavigation) - begin work

**Session Output**: Projects domain functional, types defined, foundation for tabs started

---

## References

**Spec Document**: [docs/specs/20251007-001-spec-unified-tabbed-interface.md](../specs/20251007-001-spec-unified-tabbed-interface.md)

**Acceptance Criteria**: [docs/specs/20251007-001-spec-unified-tabbed-interface-acceptance-criteria.md](../specs/20251007-001-spec-unified-tabbed-interface-acceptance-criteria.md)

**Architecture**: [docs/kb/ARCHITECTURE.md](../kb/ARCHITECTURE.md) (if exists)

**Figma Designs**:
- [Web Post List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=1-24)
- [Web Project List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=7-231)
- [Mobile Post List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-446)
- [Mobile Project List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-401)

**External Resources**:
- [W3C ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

**END OF PLAN**
