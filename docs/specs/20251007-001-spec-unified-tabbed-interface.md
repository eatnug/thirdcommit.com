# 20251007-001-SPEC: Unified Tabbed Interface

**Created**: 2025-10-07
**Status**: SPEC
**Based on**: [docs/ideas/20251007-001-idea-unified-tabbed-interface.md](../ideas/20251007-001-idea-unified-tabbed-interface.md)

---

## Feature Description

Transform thirdcommit.com from a multi-page architecture into a unified single-page interface with tab navigation. The current site has separate landing and blog pages; the new design consolidates these into one page with two tabs: "About" (showing projects) and "Blog" (showing posts). This redesign follows new Figma specifications and migrates all custom CSS to Tailwind for consistency.

**Why**: Simplifies navigation, creates a more cohesive user experience, and aligns the codebase with modern design patterns while maintaining the existing hexagonal architecture.

---

## Acceptance Criteria

### Functional Requirements

#### **AC1: Tab Navigation Behavior**
- [ ] **Given** user visits `/`, **When** page loads, **Then** "About" tab is active by default
- [ ] **Given** user is on About tab, **When** clicks "Blog" tab, **Then** Blog tab activates without full page refresh
- [ ] **Given** user is on Blog tab, **When** clicks "About" tab, **Then** About tab activates without full page refresh
- [ ] **Given** user clicks active tab, **When** tab is already selected, **Then** no action occurs (idempotent)
- [ ] **Given** user is on any tab, **When** tab is active, **Then** visual indicator shows active state (underline/highlight)
- [ ] **Given** user hovers over inactive tab, **When** mouse enters tab area, **Then** hover state displays
- [ ] **Given** user focuses tab with keyboard, **When** tab receives focus, **Then** focus indicator displays (visible outline)
- [ ] **Given** user presses Arrow Right on About tab, **When** key is pressed, **Then** focus moves to Blog tab
- [ ] **Given** user presses Arrow Left on Blog tab, **When** key is pressed, **Then** focus moves to About tab

#### **AC2: URL Synchronization**
- [ ] **Given** user switches to Blog tab, **When** tab activates, **Then** URL updates to `/?tab=blog` without full page reload
- [ ] **Given** user switches to About tab, **When** tab activates, **Then** URL updates to `/` (query param removed or `?tab=about`)
- [ ] **Given** user visits `/?tab=blog` directly, **When** page loads, **Then** Blog tab is active on first render
- [ ] **Given** user visits `/?tab=invalid`, **When** page loads, **Then** About tab displays (fallback to default)
- [ ] **Given** user switches tabs, **When** URL changes, **Then** browser back button returns to previous tab
- [ ] **Given** user presses browser forward, **When** forward button clicked, **Then** advances to next tab in history
- [ ] **Given** user bookmarks `/?tab=blog`, **When** returns via bookmark, **Then** Blog tab is active
- [ ] **Given** user shares `/?tab=blog` link, **When** recipient opens link, **Then** Blog tab is active
- [ ] **Given** page loads with query parameter, **When** server renders, **Then** correct initial tab state prevents FOUC (Flash of Unstyled Content)
- [ ] **Given** tab switching occurs, **When** URL updates, **Then** scroll position is maintained (no jump to top)
- [ ] **Given** page is generated at build time, **When** deployed to GitHub Pages, **Then** query parameter routing works correctly

#### **AC3: Content Display - About Tab**
- [ ] **Given** About tab is active, **When** content loads, **Then** projects list displays with all project cards
- [ ] **Given** projects list displays, **When** rendered, **Then** each project shows title, description, and external link
- [ ] **Given** project has external link, **When** user clicks project card or link, **Then** opens in new tab
- [ ] **Given** projects repository returns empty array, **When** About tab loads, **Then** displays "No projects yet" message
- [ ] **Given** About tab is active, **When** rendered, **Then** layout matches Figma web design on desktop (>1024px)
- [ ] **Given** About tab is active on mobile, **When** viewport <768px, **Then** layout matches Figma mobile design
- [ ] **Given** About tab displays projects, **When** content renders, **Then** uses Tailwind CSS exclusively (no custom CSS)

#### **AC3b: Content Display - Blog Tab**
- [ ] **Given** Blog tab is active, **When** content loads, **Then** posts list displays with all published post cards
- [ ] **Given** posts list displays, **When** rendered, **Then** each post shows title, description, date, and reading time
- [ ] **Given** user clicks post card, **When** clicked, **Then** navigates to `/posts?id={slug}`
- [ ] **Given** blog repository returns empty array, **When** Blog tab loads, **Then** displays "No posts yet" message
- [ ] **Given** Blog tab is active, **When** rendered, **Then** layout matches Figma web design on desktop
- [ ] **Given** Blog tab is active on mobile, **When** viewport <768px, **Then** layout matches Figma mobile design
- [ ] **Given** Blog tab displays, **When** content renders, **Then** reuses existing PostCard component
- [ ] **Given** Blog tab is active, **When** rendered, **Then** uses Tailwind CSS exclusively

#### **AC4: Projects Data Structure**
- [ ] **Given** domain layer is implemented, **When** code is structured, **Then** Projects domain exists at `src/domain/projects/`
- [ ] **Given** Projects domain exists, **When** entities are defined, **Then** `Project` interface includes `title`, `description`, `externalLink` fields
- [ ] **Given** repository is implemented, **When** interface is defined, **Then** `IProjectRepository` port exists with `getProjects(): Promise<Project[]>` method
- [ ] **Given** repository implementation exists, **When** called, **Then** `InMemoryProjectRepository` returns hardcoded array of Project objects
- [ ] **Given** use case is implemented, **When** imported, **Then** `getProjectsUseCase(repository)` function exists and returns projects
- [ ] **Given** API factory exists, **When** called, **Then** `createProjectsApi(repository)` returns public API with `getProjects()` method
- [ ] **Given** Projects domain follows architecture, **When** inspected, **Then** structure mirrors existing Blog domain (entities, ports, use-cases, index.ts)
- [ ] **Given** Projects repository is used, **When** server component calls it, **Then** data fetching completes at build time (SSG)

#### **AC5: Blog List Integration**
- [ ] **Given** Blog tab displays posts, **When** data is fetched, **Then** uses existing `createBlogApi(repository).getPosts()` use case
- [ ] **Given** Blog tab displays posts, **When** rendered, **Then** applies existing `PostVisibilityPolicy` (filters drafts in production)
- [ ] **Given** Blog tab uses blog domain, **When** code is reviewed, **Then** no changes made to `src/domain/blog/` or `src/infrastructure/blog/`
- [ ] **Given** Blog tab reuses components, **When** rendered, **Then** uses existing `PostCard` component without modifications

#### **AC6: Post Detail Navigation**
- [ ] **Given** post detail page exists, **When** accessed, **Then** URL format is `/posts?id={slug}` (query parameter, not path segment)
- [ ] **Given** user clicks post from Blog tab, **When** navigated, **Then** URL is `/posts?id={slug}`
- [ ] **Given** user is on post detail page, **When** presses browser back, **Then** returns to previous location (Blog tab if came from Blog)
- [ ] **Given** post detail page displays, **When** rendered, **Then** "Back" button uses `router.back()` (browser history)
- [ ] **Given** old post URL `/posts/{slug}` is accessed, **When** page loads, **Then** redirects to `/posts?id={slug}` (301 permanent redirect)
- [ ] **Given** post detail page loads, **When** slug parameter is read, **Then** uses `searchParams.get('id')` to retrieve slug
- [ ] **Given** post ID contains special characters, **When** URL is constructed, **Then** slug is properly URL-encoded
- [ ] **Given** post ID is read from URL, **When** decoded, **Then** `decodeURIComponent()` is applied before repository lookup
- [ ] **Given** post detail page exists, **When** deployed as static export, **Then** query parameter routing works correctly

#### **AC7: Editor Access in Dev Mode**
- [ ] **Given** app runs in development mode, **When** navigation header renders, **Then** "Write" menu item is visible
- [ ] **Given** app runs in production mode, **When** navigation header renders, **Then** "Write" menu item is hidden
- [ ] **Given** user is in dev mode, **When** clicks "Write" menu, **Then** navigates to `/editor`
- [ ] **Given** post detail page displays in dev, **When** user has edit permissions, **Then** "Edit" button links to `/editor?id={postId}`
- [ ] **Given** environment check occurs, **When** code runs, **Then** uses `process.env.NODE_ENV === 'development'` for visibility logic

#### **AC8: Redirects from Old URLs**
- [ ] **Given** user visits `/blog`, **When** page loads, **Then** redirects to `/?tab=blog` with 301 status (permanent redirect)
- [ ] **Given** redirect occurs, **When** user is redirected, **Then** Blog tab is active on arrival
- [ ] **Given** static export is deployed, **When** user visits `/blog`, **Then** client-side redirect (meta refresh or JS) redirects to `/?tab=blog`
- [ ] **Given** external link points to `/blog`, **When** followed, **Then** redirect preserves SEO value (301 or meta refresh canonical)

---

### Non-Functional Requirements

#### **NFR1: Performance**
- [ ] **Given** user visits homepage, **When** page loads, **Then** First Contentful Paint (FCP) occurs within 1.5 seconds
- [ ] **Given** homepage is fully interactive, **When** measured, **Then** Time to Interactive (TTI) is under 3.5 seconds
- [ ] **Given** user loads any page, **When** largest element renders, **Then** Largest Contentful Paint (LCP) occurs within 2.5 seconds
- [ ] **Given** user switches tabs, **When** transition occurs, **Then** new content displays within 100ms (instant feel)
- [ ] **Given** page layout renders, **When** content loads, **Then** Cumulative Layout Shift (CLS) score is 0 (no layout shifts)
- [ ] **Given** static build runs, **When** `npm run build` executes, **Then** completes successfully without errors
- [ ] **Given** static export is generated, **When** output size is measured, **Then** total bundle size increase is <50KB compared to current
- [ ] **Given** tab content pre-loads, **When** initial page renders, **Then** all tab content (projects + posts) is in HTML for SEO
- [ ] **Given** user has slow connection, **When** page loads, **Then** critical rendering path is optimized (inline critical CSS)

#### **NFR2: Accessibility (WCAG 2.1 Level AA)**

**ARIA Implementation:**
- [ ] **Given** tabs are rendered, **When** inspected, **Then** tab container has `role="tablist"` attribute
- [ ] **Given** tab buttons exist, **When** inspected, **Then** each button has `role="tab"` attribute
- [ ] **Given** tab content exists, **When** inspected, **Then** each content area has `role="tabpanel"` attribute
- [ ] **Given** tab is active, **When** ARIA state is checked, **Then** active tab has `aria-selected="true"`, inactive have `aria-selected="false"`
- [ ] **Given** tab button exists, **When** associations are checked, **Then** tab has `aria-controls="{panel-id}"` pointing to controlled panel
- [ ] **Given** tab panel exists, **When** associations are checked, **Then** panel has `aria-labelledby="{tab-id}"` pointing to controlling tab
- [ ] **Given** tab navigation exists, **When** labeled, **Then** tablist has `aria-label="Main navigation"` or similar descriptive label

**Keyboard Navigation:**
- [ ] **Given** user presses Tab key, **When** focus enters tablist, **Then** focus lands on active tab (roving tabindex pattern)
- [ ] **Given** user presses Arrow Right, **When** on About tab, **Then** focus moves to Blog tab
- [ ] **Given** user presses Arrow Left, **When** on Blog tab, **Then** focus moves to About tab
- [ ] **Given** user presses Home key, **When** in tablist, **Then** focus moves to first tab (About)
- [ ] **Given** user presses End key, **When** in tablist, **Then** focus moves to last tab (Blog)
- [ ] **Given** user presses Enter or Space, **When** tab has focus, **Then** tab activates (manual activation pattern)
- [ ] **Given** inactive tab exists, **When** tabindex is checked, **Then** inactive tabs have `tabIndex={-1}` (not in tab order)
- [ ] **Given** active tab exists, **When** tabindex is checked, **Then** active tab has `tabIndex={0}` (in tab order)

**Screen Reader Support:**
- [ ] **Given** screen reader is active, **When** user navigates tabs, **Then** screen reader announces tab name and selected state
- [ ] **Given** tab switches, **When** content changes, **Then** screen reader announces new content via `aria-live="polite"` region
- [ ] **Given** tab panel displays, **When** screen reader enters panel, **Then** announces relationship to controlling tab
- [ ] **Given** all interactive elements exist, **When** inspected, **Then** all have accessible names (text or aria-label)

**Visual Indicators:**
- [ ] **Given** tab receives keyboard focus, **When** focused, **Then** visible focus indicator displays (2px outline minimum)
- [ ] **Given** color is used for active state, **When** checked, **Then** non-color indicators also exist (underline, bold, etc.)
- [ ] **Given** text contrast is measured, **When** compared to background, **Then** all text meets 4.5:1 ratio (normal text) or 3:1 (large text ≥18pt)

#### **NFR3: SEO**
- [ ] **Given** page metadata exists, **When** About tab is active, **Then** `<title>` is "Jake Park - Software Engineer" or similar
- [ ] **Given** page metadata exists, **When** Blog tab is active, **Then** `<title>` is "Blog - Jake Park" or similar
- [ ] **Given** page metadata exists, **When** meta description is checked, **Then** different description exists for each tab
- [ ] **Given** canonical URL is set, **When** About tab is active, **Then** canonical URL is `https://thirdcommit.com/`
- [ ] **Given** canonical URL is set, **When** Blog tab is active, **Then** canonical URL is `https://thirdcommit.com/?tab=blog`
- [ ] **Given** sitemap.xml exists, **When** inspected, **Then** includes both `/` and `/?tab=blog` as separate entries
- [ ] **Given** sitemap includes tabs, **When** checked, **Then** no duplicate content (both tabs don't have same canonical)
- [ ] **Given** Open Graph tags exist, **When** page is shared, **Then** og:title, og:description, og:url differ per tab
- [ ] **Given** old URLs are redirected, **When** redirect is implemented, **Then** uses 301 status (or meta refresh for static export)
- [ ] **Given** post URLs change, **When** old URLs are accessed, **Then** proper redirects exist (301 or meta canonical)
- [ ] **Given** structured data exists, **When** schema.org markup is checked, **Then** valid JSON-LD for person/blog exists
- [ ] **Given** search engines crawl, **When** JavaScript is disabled, **Then** initial tab content is in HTML (server-rendered)

#### **NFR4: Responsive Design**
- [ ] **Given** viewport is mobile (<768px), **When** tabs render, **Then** tabs display horizontally without dropdown
- [ ] **Given** viewport is mobile, **When** content renders, **Then** single column layout for projects/posts
- [ ] **Given** viewport is tablet (768px-1024px), **When** content renders, **Then** 2-column grid for projects/posts
- [ ] **Given** viewport is desktop (>1024px), **When** content renders, **Then** layout matches Figma desktop design
- [ ] **Given** viewport is mobile, **When** tabs overflow, **Then** horizontal scroll is enabled (not truncated)
- [ ] **Given** user rotates device, **When** orientation changes, **Then** layout adapts without breaking
- [ ] **Given** user zooms page, **When** zoom level changes, **Then** layout remains functional up to 200% zoom (WCAG requirement)
- [ ] **Given** touch device is used, **When** user taps tab, **Then** tap target is minimum 44x44px (touch-friendly)
- [ ] **Given** responsive images exist, **When** rendered, **Then** appropriate image sizes load per breakpoint (if applicable)

#### **NFR5: Browser Compatibility**
- [ ] **Given** user uses Chrome, **When** feature is tested, **Then** all functionality works (last 2 versions)
- [ ] **Given** user uses Firefox, **When** feature is tested, **Then** all functionality works (last 2 versions)
- [ ] **Given** user uses Safari, **When** feature is tested, **Then** all functionality works (last 2 versions)
- [ ] **Given** user uses Edge, **When** feature is tested, **Then** all functionality works (last 2 versions)
- [ ] **Given** user uses iOS Safari, **When** feature is tested, **Then** all functionality works (iOS 15+)
- [ ] **Given** user uses Chrome Mobile, **When** feature is tested, **Then** all functionality works (Android 12+)
- [ ] **Given** JavaScript is disabled, **When** page loads, **Then** default tab content displays (graceful degradation)
- [ ] **Given** user is in private/incognito mode, **When** page loads, **Then** functionality works (no localStorage dependency in MVP)

---

### Technical Requirements

#### **TR1: Architecture**

**Component Structure:**
- [ ] **Given** component architecture is implemented, **When** inspected, **Then** server component exists at `app/page.tsx` (data fetching)
- [ ] **Given** client components exist, **When** inspected, **Then** `TabsUI` client component handles URL sync and tab switching
- [ ] **Given** tab components exist, **When** inspected, **Then** `TabNavigation` component implements ARIA tab pattern
- [ ] **Given** tab panels exist, **When** inspected, **Then** `TabPanel` wrapper component provides ARIA structure
- [ ] **Given** project components exist, **When** inspected, **Then** `ProjectCard` component exists similar to `PostCard`
- [ ] **Given** content components exist, **When** inspected, **Then** `ProjectsList` and `BlogList` components exist for tab content

**Client/Server Boundaries:**
- [ ] **Given** data fetching occurs, **When** implemented, **Then** all data (posts + projects) fetched in Server Component
- [ ] **Given** data is passed down, **When** rendered, **Then** Server Component passes data to Client Component as props
- [ ] **Given** interactivity is needed, **When** implemented, **Then** only `TabsUI` and children are marked `"use client"`

**Route Structure:**
- [ ] **Given** app router is structured, **When** inspected, **Then** unified page exists at `app/page.tsx` (not in route group)
- [ ] **Given** blog route exists, **When** inspected, **Then** `app/blog/page.tsx` contains redirect logic (client-side) or is removed
- [ ] **Given** post detail exists, **When** inspected, **Then** route is `app/posts/page.tsx` (reads query param, not dynamic segment)
- [ ] **Given** navigation header exists, **When** inspected, **Then** moved to `app/layout.tsx` or shared component (not route group specific)
- [ ] **Given** Suspense is required, **When** `useSearchParams` is used, **Then** component is wrapped in `<Suspense>` boundary

#### **TR2: Data Models**

**Project Entity:**
```typescript
interface Project {
  title: string
  description: string
  externalLink?: string
}
```
- [ ] **Given** Project entity is defined, **When** type is checked, **Then** includes `title: string` field
- [ ] **Given** Project entity is defined, **When** type is checked, **Then** includes `description: string` field
- [ ] **Given** Project entity is defined, **When** type is checked, **Then** includes optional `externalLink?: string` field

**Repository Port:**
```typescript
interface IProjectRepository {
  getProjects(): Promise<Project[]>
}
```
- [ ] **Given** repository port exists, **When** interface is checked, **Then** defines `getProjects(): Promise<Project[]>` method signature

#### **TR3: API Contracts**

**Use Cases:**
- [ ] **Given** use case exists, **When** signature is checked, **Then** `getProjectsUseCase(repository: IProjectRepository): Promise<Project[]>` is defined
- [ ] **Given** blog use case is used, **When** code is reviewed, **Then** existing `getPostsUseCase(repository: IPostRepository)` is called without modification

**Public API:**
- [ ] **Given** domain API exists, **When** barrel export is checked, **Then** `src/domain/projects/index.ts` exports `{ createProjectsApi, Project, IProjectRepository }`
- [ ] **Given** API factory exists, **When** signature is checked, **Then** `createProjectsApi(repository: IProjectRepository)` returns `{ getProjects: () => Promise<Project[]> }`

#### **TR4: Technology Choices**

**Component Technology:**
- [ ] **Given** tab markup is rendered, **When** HTML is inspected, **Then** semantic HTML with ARIA attributes is used (not div soup)
- [ ] **Given** Button component is used, **When** inspected, **Then** existing `Button` component from `app/_components/button.tsx` is reused
- [ ] **Given** Card component is used, **When** inspected, **Then** existing `Card` primitives from `app/_components/card.tsx` are reused
- [ ] **Given** PostCard is used, **When** inspected, **Then** existing `PostCard` from blog is reused without modification

**Styling:**
- [ ] **Given** styles are applied, **When** inspected, **Then** Tailwind CSS utility classes are used exclusively
- [ ] **Given** old styles exist, **When** migration is complete, **Then** `app/page.css` file is deleted
- [ ] **Given** design tokens are used, **When** styles are applied, **Then** Tailwind theme tokens (`bg-card`, `text-foreground`) are used

**URL Management:**
- [ ] **Given** URL is read, **When** implemented, **Then** `useSearchParams()` hook from `next/navigation` is used
- [ ] **Given** URL is updated, **When** implemented, **Then** `useRouter().replace()` from `next/navigation` is used
- [ ] **Given** URL is updated, **When** called, **Then** `{ scroll: false }` option is passed to prevent scroll jump

---

### Error Scenarios & Edge Cases

#### **ES1: Invalid Tab Parameter**
- [ ] **Given** user visits `/?tab=invalid`, **When** page loads, **Then** About tab displays (default fallback)
- [ ] **Given** tab parameter is validated, **When** checked, **Then** only `'about'` and `'blog'` are valid values
- [ ] **Given** tab parameter contains XSS attempt, **When** sanitized, **Then** script tags are stripped/encoded before rendering

#### **ES2: Missing Data**
- [ ] **Given** projects repository returns empty array, **When** About tab renders, **Then** displays "No projects yet" empty state
- [ ] **Given** posts repository returns empty array, **When** Blog tab renders, **Then** displays "No posts yet" empty state
- [ ] **Given** post slug is invalid, **When** post detail loads, **Then** displays 404 page or error message
- [ ] **Given** post slug is missing, **When** `/posts` is accessed without query param, **Then** displays error or redirects to blog

#### **ES3: Network Failures**
- [ ] **Given** data fetching fails at build time, **When** error occurs, **Then** build process shows clear error message
- [ ] **Given** static export fails, **When** error occurs, **Then** build script exits with non-zero code
- [ ] **Given** repository throws error, **When** caught, **Then** logs error and shows user-friendly error boundary

#### **ES4: Static Export Edge Cases**
- [ ] **Given** static export is deployed, **When** query params are used, **Then** client-side routing works correctly
- [ ] **Given** GitHub Pages serves site, **When** `/blog` is accessed, **Then** meta refresh redirect works (no server redirect available)
- [ ] **Given** initial page loads, **When** server-rendered, **Then** correct tab state prevents hydration mismatch
- [ ] **Given** build generates pages, **When** inspected, **Then** both tab states have content in HTML (SEO-friendly)

#### **ES5: Browser History Edge Cases**
- [ ] **Given** user switches tabs multiple times, **When** back button is pressed, **Then** returns to previous tab state
- [ ] **Given** user navigates post → back to blog, **When** back is pressed, **Then** returns to Blog tab (not About)
- [ ] **Given** user bookmarks mid-session, **When** returns via bookmark, **Then** exact tab state is restored

#### **ES6: URL Parameter Conflicts**
- [ ] **Given** URL has multiple tab params (`?tab=blog&tab=about`), **When** parsed, **Then** first occurrence is used
- [ ] **Given** post detail has tab param (`/posts?id=x&tab=blog`), **When** loaded, **Then** tab param is ignored (not applicable)
- [ ] **Given** URL has unrelated params (`/?tab=blog&utm_source=twitter`), **When** parsed, **Then** analytics params are preserved

#### **ES7: Accessibility Edge Cases**
- [ ] **Given** screen reader is active, **When** tab switches, **Then** announces change via aria-live region
- [ ] **Given** user navigates with keyboard only, **When** tab changes, **Then** focus management moves to panel or stays on tab
- [ ] **Given** high contrast mode is enabled, **When** tabs render, **Then** active state is visible (not color-only)
- [ ] **Given** user zooms to 200%, **When** layout adapts, **Then** tabs remain functional and visible

#### **ES8: Mobile Device Edge Cases**
- [ ] **Given** mobile keyboard is open, **When** viewport resizes, **Then** layout adapts without breaking
- [ ] **Given** user has small screen (<320px), **When** tabs render, **Then** content remains accessible (no cut-off)
- [ ] **Given** iOS safe area insets exist, **When** rendered, **Then** content respects safe area (no notch overlap)

---

## Technical Requirements (Detailed)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: Volatile (Presentation Layer)                   │
│                                                           │
│  app/page.tsx (Server Component)                          │
│    ├─ Fetches: blog.getPosts()                            │
│    ├─ Fetches: projectsApi.getProjects()                  │
│    └─ Renders: <TabsUI posts={posts} projects={projects}> │
│                                                           │
│  app/_components/tabs/tabs-ui.tsx (Client Component)      │
│    ├─ useSearchParams() for active tab                    │
│    ├─ <TabNavigation activeTab={tab} />                   │
│    └─ <TabPanel> for About and Blog content               │
│                                                           │
└─────────────────────────────────────────────────────────┘
                        ↓ depends on
┌─────────────────────────────────────────────────────────┐
│  TIER 3: Stable (Domain Layer)                           │
│                                                           │
│  src/domain/blog/                                         │
│    └─ createBlogApi(repository).getPosts()                │
│                                                           │
│  src/domain/projects/ (NEW)                               │
│    ├─ entities/project.entity.ts                          │
│    ├─ ports/project-repository.port.ts                    │
│    ├─ use-cases/get-projects.use-case.ts                  │
│    └─ index.ts (exports createProjectsApi)                │
│                                                           │
└─────────────────────────────────────────────────────────┘
                        ↓ depends on
┌─────────────────────────────────────────────────────────┐
│  TIER 2: Moderate (Infrastructure Layer)                 │
│                                                           │
│  src/infrastructure/blog/ (UNCHANGED)                     │
│    └─ FileSystemPostRepository                            │
│                                                           │
│  src/infrastructure/projects/ (NEW)                       │
│    └─ InMemoryProjectRepository                           │
│         └─ getProjects() returns hardcoded array          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Initial Page Load (Server-Side):**
```typescript
// app/page.tsx (Server Component)
export default async function HomePage({ searchParams }: Props) {
  const tab = getValidTab(searchParams)

  // Fetch all data at build time (SSG)
  const [posts, projects] = await Promise.all([
    createBlogApi(await getServerPostRepository()).getPosts(),
    createProjectsApi(getProjectRepository()).getProjects()
  ])

  return (
    <Suspense fallback={<PageSkeleton />}>
      <TabsUI initialTab={tab} posts={posts} projects={projects} />
    </Suspense>
  )
}
```

**Client-Side Tab Switching:**
```typescript
// app/_components/tabs/tabs-ui.tsx (Client Component)
'use client'

export function TabsUI({ initialTab, posts, projects }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const tab = getValidTab(searchParams)
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      <TabNavigation activeTab={activeTab} onChange={handleTabChange} />
      <TabPanel id="about" isActive={activeTab === 'about'}>
        <ProjectsList projects={projects} />
      </TabPanel>
      <TabPanel id="blog" isActive={activeTab === 'blog'}>
        <BlogList posts={posts} />
      </TabPanel>
    </div>
  )
}
```

### Component Specifications

#### **TabNavigation Component**
```typescript
// app/_components/tabs/tab-navigation.tsx
'use client'

interface TabNavigationProps {
  activeTab: 'about' | 'blog'
  onChange: (tab: 'about' | 'blog') => void
}

export function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  const handleKeyDown = (e: React.KeyboardEvent, currentTab: 'about' | 'blog') => {
    if (e.key === 'ArrowRight') {
      onChange('blog')
    } else if (e.key === 'ArrowLeft') {
      onChange('about')
    }
  }

  return (
    <div role="tablist" aria-label="Main navigation" className="border-b">
      <nav className="flex gap-8">
        <button
          role="tab"
          id="tab-about"
          aria-selected={activeTab === 'about'}
          aria-controls="panel-about"
          tabIndex={activeTab === 'about' ? 0 : -1}
          onClick={() => onChange('about')}
          onKeyDown={(e) => handleKeyDown(e, 'about')}
          className={cn(
            'pb-4 border-b-2 transition-colors',
            activeTab === 'about'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          About
        </button>
        <button
          role="tab"
          id="tab-blog"
          aria-selected={activeTab === 'blog'}
          aria-controls="panel-blog"
          tabIndex={activeTab === 'blog' ? 0 : -1}
          onClick={() => onChange('blog')}
          onKeyDown={(e) => handleKeyDown(e, 'blog')}
          className={cn(
            'pb-4 border-b-2 transition-colors',
            activeTab === 'blog'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Blog
        </button>
      </nav>
    </div>
  )
}
```

#### **TabPanel Component**
```typescript
// app/_components/tabs/tab-panel.tsx

interface TabPanelProps {
  id: string
  isActive: boolean
  children: React.ReactNode
}

export function TabPanel({ id, isActive, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      tabIndex={0}
      className="mt-8 focus:outline-none"
    >
      {children}
    </div>
  )
}
```

#### **ProjectCard Component**
```typescript
// app/_components/projects/project-card.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/app/_components/card'
import { ExternalLink } from 'lucide-react'
import type { Project } from '@/domain/projects'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {project.externalLink ? (
            <a
              href={project.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-2"
            >
              {project.title}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            project.title
          )}
        </CardTitle>
        <CardDescription>
          {project.description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
```

### Projects Domain Layer Structure

```
src/domain/projects/
├── entities/
│   └── project.entity.ts          # Project interface
├── ports/
│   └── project-repository.port.ts # IProjectRepository interface
├── use-cases/
│   └── get-projects.use-case.ts   # getProjectsUseCase function
└── index.ts                        # Public API exports

src/infrastructure/projects/
└── repositories/
    ├── project.repository.ts       # Repository provider (getProjectRepository)
    └── project.inmemory.repository.ts # InMemoryProjectRepository implementation
```

**Example Implementation:**

```typescript
// src/domain/projects/entities/project.entity.ts
export interface Project {
  title: string
  description: string
  externalLink?: string
}

// src/domain/projects/ports/project-repository.port.ts
import type { Project } from '../entities/project.entity'

export interface IProjectRepository {
  getProjects(): Promise<Project[]>
}

// src/domain/projects/use-cases/get-projects.use-case.ts
import type { IProjectRepository } from '../ports/project-repository.port'
import type { Project } from '../entities/project.entity'

export async function getProjectsUseCase(
  repository: IProjectRepository
): Promise<Project[]> {
  return repository.getProjects()
}

// src/domain/projects/index.ts
export * from './entities/project.entity'
export * from './ports/project-repository.port'
export { getProjectsUseCase } from './use-cases/get-projects.use-case'

export function createProjectsApi(repository: IProjectRepository) {
  return {
    getProjects: () => getProjectsUseCase(repository)
  }
}

// src/infrastructure/projects/repositories/project.inmemory.repository.ts
import type { IProjectRepository } from '@/domain/projects'
import type { Project } from '@/domain/projects'

export class InMemoryProjectRepository implements IProjectRepository {
  async getProjects(): Promise<Project[]> {
    return [
      {
        title: 'Terminal X',
        description: 'AI research agent for finance professionals',
        externalLink: 'https://theterminalx.com/'
      },
      {
        title: 'Claude Code',
        description: 'Open-source AI coding assistant',
        externalLink: 'https://github.com/anthropics/claude-code'
      }
      // ... more projects
    ]
  }
}

// src/infrastructure/projects/repositories/project.repository.ts
import type { IProjectRepository } from '@/domain/projects'

let instance: IProjectRepository | null = null

export function getProjectRepository(): IProjectRepository {
  if (!instance) {
    const { InMemoryProjectRepository } = require('./project.inmemory.repository')
    instance = new InMemoryProjectRepository()
  }
  return instance
}
```

---

## Best Practices Applied

### From Research

**URL-Based State Management:**
- Use `useSearchParams()` + `router.replace()` for client-side navigation
- Wrap in `<Suspense>` boundary (Next.js requirement)
- Set `{ scroll: false }` to prevent scroll jumps
- Default tab: 'about' (fallback for invalid params)

**Accessibility (WCAG 2.1 AA):**
- Full ARIA tabs pattern (tablist, tab, tabpanel roles)
- Roving tabindex pattern (only active tab has tabIndex=0)
- Keyboard navigation (Arrow Left/Right, Home/End)
- Screen reader announcements via aria-live
- 4.5:1 color contrast ratio for text

**Performance:**
- Fetch all data server-side (SSG at build time)
- No lazy loading (dataset is small, instant tab switching)
- Conditional rendering (not `hidden` attribute for SEO)
- Memoize list components to prevent re-renders

**SEO:**
- Different metadata per tab (title, description)
- Canonical URLs (strip query params for About)
- Sitemap includes both tab URLs
- Server-render correct initial tab state (no FOUC)

### From Existing Codebase

**Hexagonal Architecture:**
- New Projects domain follows Blog structure (entities, ports, use-cases)
- Repository pattern with interface (IProjectRepository)
- API factory function (createProjectsApi)
- Infrastructure layer handles data source (InMemoryProjectRepository)

**Component Patterns:**
- Reuse Card primitives (CardHeader, CardTitle, CardDescription)
- Follow PostCard pattern for ProjectCard
- Use Button component with variants
- Utility-first Tailwind classes with design tokens

**Import Aliases:**
- `@/domain/projects` for domain layer
- `@/app/_components` for shared components
- `@/src/shared/utils` for utilities (cn helper)

---

## Edge Cases & Mitigation Strategies

### Critical: Static Export Redirects

**Problem**: Next.js `redirects()` in `next.config.ts` don't work with `output: 'export'` (GitHub Pages limitation)

**Solution**: Generate static HTML redirect pages with meta refresh

```typescript
// scripts/generate-redirects.ts
import fs from 'fs'
import path from 'path'

const redirectTemplate = (destination: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${destination}">
  <link rel="canonical" href="https://thirdcommit.com${destination}" />
  <script>window.location.replace('${destination}');</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${destination}">${destination}</a>...</p>
</body>
</html>
`

// Generate blog redirect
fs.mkdirSync('out/blog', { recursive: true })
fs.writeFileSync('out/blog/index.html', redirectTemplate('/?tab=blog'))

console.log('✅ Redirects generated')
```

**Integration**:
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "export": "npm run build && tsx scripts/generate-redirects.ts"
  }
}
```

### High: Post URL Migration

**Decision Required**: Keep `/posts/[slug]` route or migrate to `/posts?id={slug}`?

**Recommendation**: Keep both routes for 6 months (Option A)

```typescript
// app/(with-nav)/posts/[slug]/page.tsx (redirect to new format)
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
    router.replace(`/posts?id=${slug}`)
  }, [slug, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
```

After 6 months, remove old route.

### Medium: Client-Side Hydration Mismatch

**Problem**: Server renders default "About" tab, client reads `?tab=blog` and switches, causing FOUC

**Solution**: Pass searchParams to client component for consistent initial state

```typescript
// app/page.tsx
export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const initialTab = getValidTab(params)

  // Fetch data
  const [posts, projects] = await Promise.all([...])

  return (
    <Suspense>
      <TabsUI initialTab={initialTab} posts={posts} projects={projects} />
    </Suspense>
  )
}

// app/_components/tabs/tabs-ui.tsx
'use client'
export function TabsUI({ initialTab, posts, projects }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab) // Matches server render
  // ...
}
```

### Low: Empty State Handling

```typescript
// app/_components/projects/projects-list.tsx
export function ProjectsList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {projects.map(project => (
        <ProjectCard key={project.title} project={project} />
      ))}
    </div>
  )
}
```

---

## Success Metrics

**User Experience:**
- Tab switching feels instant (< 100ms perceived latency)
- Browser back/forward works intuitively
- Deep linking works (shareable tab URLs)

**Performance:**
- Lighthouse score >90 (Performance, Accessibility, Best Practices, SEO)
- Core Web Vitals pass (LCP <2.5s, FID <100ms, CLS <0.1)
- Build time increase <10% vs current

**Accessibility:**
- axe DevTools reports 0 violations
- Screen reader testing passes (VoiceOver/NVDA)
- Keyboard navigation fully functional

**SEO:**
- No 404 spikes in Google Search Console
- Both tabs indexed separately
- Search traffic stable or improved

---

## Out of Scope

**Explicitly Excluded:**
- Tags feature implementation
- Filesystem-based projects (use hardcoded array)
- Reading time/dates for projects
- Mobile dropdown navigation
- Changes to blog domain/infrastructure layers
- Editor functionality changes
- Animation/transitions for tab switching (nice-to-have for future)
- Tab state persistence in localStorage (nice-to-have for future)
- Swipe gestures on mobile (nice-to-have for future)

**Future Considerations:**
- Migrate projects from hardcoded array to markdown files
- Add search/filter functionality
- Implement smooth tab transitions
- Remember user's preferred tab (localStorage)
- Analytics tracking for tab engagement

---

## Open Questions

1. **Old post URLs**: Keep `/posts/[slug]` as redirect or break external links?
   - **Recommendation**: Keep for 6 months, then remove

2. **Default tab**: What should `/` display - About or Blog?
   - **Answer**: About (projects) per Q2 in IDEA doc

3. **Tab history**: Use `router.push()` or `router.replace()` for tab changes?
   - **Recommendation**: `router.replace()` to avoid cluttering history

4. **Tab activation**: Automatic (on arrow key) or manual (requires Enter)?
   - **Recommendation**: Manual activation for better accessibility

5. **Canonical URLs**: Should `/?tab=about` have different canonical than `/`?
   - **Recommendation**: Both canonicalize to `https://thirdcommit.com/` (same content)

---

## Next Steps

### Phase 1: Foundation (2-3 hours)
- [ ] Create Projects domain layer (entities, ports, use-cases)
- [ ] Implement InMemoryProjectRepository with hardcoded data
- [ ] Create tab validation utility (`getValidTab`)
- [ ] Set up TypeScript types for tab values

### Phase 2: Components (3-4 hours)
- [ ] Create TabNavigation component (ARIA pattern)
- [ ] Create TabPanel wrapper component
- [ ] Create TabsUI orchestrator component
- [ ] Create ProjectCard component
- [ ] Create ProjectsList component

### Phase 3: Page Restructuring (2-3 hours)
- [ ] Rewrite `app/page.tsx` as unified interface
- [ ] Create redirect page at `app/blog/page.tsx`
- [ ] Update post detail to use query params
- [ ] Move navigation header to root layout

### Phase 4: Styling Migration (2-3 hours)
- [ ] Convert `page.css` to Tailwind classes
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Test with Figma designs
- [ ] Delete `page.css`

### Phase 5: Redirects & Deploy (1-2 hours)
- [ ] Create `scripts/generate-redirects.ts`
- [ ] Update build script to generate redirects
- [ ] Test static export locally
- [ ] Deploy to GitHub Pages
- [ ] Verify redirects work

### Phase 6: Testing & Validation (2-3 hours)
- [ ] Test keyboard navigation (Arrow keys, Tab, Enter)
- [ ] Test screen reader (VoiceOver/NVDA)
- [ ] Run Lighthouse audit (aim for >90 all categories)
- [ ] Run axe DevTools (0 violations)
- [ ] Test on Safari, Chrome, Firefox, Edge
- [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
- [ ] Verify SEO (submit sitemap to Google Search Console)

**Total Estimated Time**: 12-18 hours

---

## Definition of Done

- ✅ All acceptance criteria checked and passing
- ✅ Lighthouse score >90 in all categories
- ✅ axe DevTools reports 0 accessibility violations
- ✅ Screen reader testing passed (VoiceOver + NVDA)
- ✅ Keyboard navigation fully functional
- ✅ Cross-browser testing passed (Chrome, Safari, Firefox, Edge)
- ✅ Mobile testing passed (iOS, Android)
- ✅ Static export builds successfully
- ✅ Redirects tested and working
- ✅ No regressions in existing blog/editor functionality
- ✅ Code reviewed (self-review against architecture principles)
- ✅ Documentation updated (README if applicable)
- ✅ Deployed to production (GitHub Pages)
- ✅ Google Search Console updated with new sitemap

---

## References

**Idea Document**: [docs/ideas/20251007-001-idea-unified-tabbed-interface.md](../ideas/20251007-001-idea-unified-tabbed-interface.md)

**Architecture**: [docs/kb/ARCHITECTURE.md](../kb/ARCHITECTURE.md)

**Figma Designs**:
- [Web Post List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=1-24)
- [Web Project List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=7-231)
- [Mobile Post List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-446)
- [Mobile Project List](https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-401)

**External Resources**:
- [W3C ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js Static Export](https://nextjs.org/docs/pages/guides/static-exports)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
