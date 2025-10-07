# Acceptance Criteria: Unified Tabbed Interface

**Created**: 2025-10-07
**Related Idea**: [20251007-001-idea-unified-tabbed-interface.md](../ideas/20251007-001-idea-unified-tabbed-interface.md)

---

## Table of Contents

1. [Functional Requirements](#functional-requirements)
2. [Non-Functional Requirements](#non-functional-requirements)
3. [Technical Requirements](#technical-requirements)
4. [Error Scenarios & Edge Cases](#error-scenarios--edge-cases)

---

## Functional Requirements

### FR-1: Tab Navigation Behavior

#### FR-1.1: Tab Display and Activation
- [ ] **Given** the user visits `/`, **When** the page loads, **Then** the "About" tab is displayed as active by default
- [ ] **Given** the user visits `/?tab=blog`, **When** the page loads, **Then** the "Blog" tab is displayed as active
- [ ] **Given** the user clicks on the "About" tab, **When** the tab is not currently active, **Then** the tab switches to "About" without full page reload
- [ ] **Given** the user clicks on the "Blog" tab, **When** the tab is not currently active, **Then** the tab switches to "Blog" without full page reload
- [ ] **Given** the user clicks on an already active tab, **When** the tab is clicked, **Then** no navigation occurs (idempotent behavior)

#### FR-1.2: Tab Visual States
- [ ] **Given** any tab navigation scenario, **When** a tab is active, **Then** it displays with active visual styling matching Figma designs
- [ ] **Given** any tab navigation scenario, **When** a tab is inactive, **Then** it displays with inactive visual styling matching Figma designs
- [ ] **Given** the user hovers over an inactive tab, **When** the mouse enters the tab area, **Then** hover state is displayed per Figma design
- [ ] **Given** keyboard navigation, **When** a tab receives focus, **Then** focus indicator is visible (WCAG 2.1 Level AA compliance)

---

### FR-2: URL Synchronization

#### FR-2.1: URL Updates
- [ ] **Given** the user is on `/`, **When** they click the "Blog" tab, **Then** the URL changes to `/?tab=blog` without full page reload
- [ ] **Given** the user is on `/?tab=blog`, **When** they click the "About" tab, **Then** the URL changes to `/` without full page reload
- [ ] **Given** any tab switch, **When** the URL updates, **Then** a new history entry is pushed (browser back button works correctly)
- [ ] **Given** the user navigates via browser back button, **When** they go back from `/?tab=blog` to `/`, **Then** the "About" tab becomes active

#### FR-2.2: Direct URL Access
- [ ] **Given** the user enters `/?tab=blog` in the address bar, **When** the page loads, **Then** the "Blog" tab is active
- [ ] **Given** the user enters `/?tab=about` in the address bar, **When** the page loads, **Then** the "About" tab is active (URL parameter recognized)
- [ ] **Given** the user enters `/` in the address bar, **When** the page loads, **Then** the "About" tab is active by default
- [ ] **Given** the user enters `/?tab=invalid`, **When** the page loads, **Then** the default "About" tab is shown (graceful degradation)
- [ ] **Given** the user enters `/?tab=blog&foo=bar`, **When** the page loads, **Then** the "Blog" tab is active (additional query params ignored)

#### FR-2.3: URL Parameter Handling
- [ ] **Given** tab navigation occurs, **When** the URL contains the tab parameter, **Then** canonical URL excludes query parameters (SEO best practice)
- [ ] **Given** any page state, **When** generating sitemap, **Then** only canonical URLs (`/` and `/posts/[slug]`) are included, not `/?tab=blog`

---

### FR-3: Content Display

#### FR-3.1: About Tab (Projects List)
- [ ] **Given** the "About" tab is active, **When** the page renders, **Then** the profile section (name, photo, bio, social links) is displayed
- [ ] **Given** the "About" tab is active, **When** the page renders, **Then** all projects are displayed in a card grid layout
- [ ] **Given** each project card, **When** rendered, **Then** it shows: title, description, and external link (if available)
- [ ] **Given** each project card, **When** rendered, **Then** it does NOT show: reading time, dates, or tags
- [ ] **Given** a project has an external link, **When** the card is clicked, **Then** it opens in a new tab with `rel="noopener noreferrer"`
- [ ] **Given** a project has no external link, **When** the card is displayed, **Then** it is not clickable (no link element)

#### FR-3.2: Blog Tab (Posts List)
- [ ] **Given** the "Blog" tab is active, **When** the page renders, **Then** all published posts are displayed
- [ ] **Given** the "Blog" tab is active in production, **When** the page renders, **Then** draft posts are NOT displayed
- [ ] **Given** the "Blog" tab is active in development, **When** the page renders, **Then** both draft and published posts are displayed
- [ ] **Given** each post card, **When** rendered, **Then** it shows: title, description, created date, and reading time
- [ ] **Given** each post card link, **When** clicked, **Then** it navigates to `/posts?id={slug}` (new URL structure)
- [ ] **Given** the posts list, **When** no posts exist, **Then** an empty state message is displayed

#### FR-3.3: Visual Layout Consistency
- [ ] **Given** any tab is active, **When** the page renders, **Then** the navigation header is displayed at the top
- [ ] **Given** any device viewport, **When** content renders, **Then** all styles use Tailwind CSS (no custom CSS from `page.css`)
- [ ] **Given** tab content switches, **When** the transition occurs, **Then** the layout does not shift or cause Cumulative Layout Shift (CLS)

---

### FR-4: Projects Data Structure

#### FR-4.1: Projects Domain Layer
- [ ] **Given** the projects feature, **When** implemented, **Then** a `Project` entity exists in `src/domain/projects/entities/`
- [ ] **Given** the `Project` entity, **When** defined, **Then** it contains fields: `title`, `description`, `externalLink` (optional)
- [ ] **Given** the projects feature, **When** implemented, **Then** an `IProjectRepository` port interface exists in `src/domain/projects/ports/`
- [ ] **Given** the projects feature, **When** implemented, **Then** an `InMemoryProjectRepository` adapter exists in `src/infrastructure/projects/repositories/`
- [ ] **Given** the `InMemoryProjectRepository`, **When** queried, **Then** it returns a hardcoded array of project objects (4 projects from current landing page)

#### FR-4.2: Projects Use Case
- [ ] **Given** the projects feature, **When** implemented, **Then** a `getProjects()` use case exists in `src/domain/projects/use-cases/`
- [ ] **Given** the `getProjects()` use case, **When** called, **Then** it returns all projects without filtering (no visibility policy needed)
- [ ] **Given** the projects domain, **When** exported, **Then** a public API via `src/domain/projects/index.ts` follows barrel export pattern
- [ ] **Given** the projects API, **When** consumed, **Then** a factory function `createProjectsApi(repository)` is available

---

### FR-5: Blog List Integration

#### FR-5.1: Blog Use Case Integration
- [ ] **Given** the Blog tab, **When** rendered, **Then** it uses `getPostsUseCase` from `src/domain/blog/`
- [ ] **Given** the Blog tab, **When** rendered, **Then** posts are fetched via `createBlogApi(repository).getPosts()`
- [ ] **Given** the Blog tab data fetching, **When** in server component, **Then** it uses `getServerPostRepository()`
- [ ] **Given** existing `PostCard` component, **When** reused in unified interface, **Then** no modifications are required to the component

---

### FR-6: Post Detail Navigation

#### FR-6.1: New URL Structure
- [ ] **Given** the post detail page, **When** accessed, **Then** the route is `/posts?id={slug}` (not `/posts/[slug]`)
- [ ] **Given** a post link in the blog list, **When** clicked, **Then** it navigates to `/posts?id={slug}`
- [ ] **Given** the post detail page, **When** accessed with valid slug, **Then** it displays the full post content
- [ ] **Given** the post detail page, **When** accessed with invalid slug, **Then** it shows 404 not found page
- [ ] **Given** static site generation, **When** building, **Then** all post detail pages are generated at `/posts/index.html` with query parameter handling

#### FR-6.2: Back Navigation
- [ ] **Given** the user is on a post detail page, **When** they click the "Back" button/link, **Then** it uses browser back navigation (`router.back()`)
- [ ] **Given** the user navigates back from post detail, **When** arriving at the list page, **Then** the previously active tab ("About" or "Blog") is restored
- [ ] **Given** the user directly accesses a post detail page, **When** they click "Back" and there's no history, **Then** they navigate to `/` (default)

---

### FR-7: Editor Access in Dev Mode

#### FR-7.1: Write Menu Visibility
- [ ] **Given** the application is running in development mode, **When** the navigation header renders, **Then** a "Write" menu item is displayed
- [ ] **Given** the application is running in production mode, **When** the navigation header renders, **Then** the "Write" menu item is NOT displayed
- [ ] **Given** the "Write" menu item, **When** clicked in dev mode, **Then** it navigates to `/editor` page

#### FR-7.2: Edit Button on Post Detail
- [ ] **Given** a post detail page in development mode, **When** the page renders, **Then** an "Edit" button is displayed
- [ ] **Given** a post detail page in production mode, **When** the page renders, **Then** the "Edit" button is NOT displayed
- [ ] **Given** the "Edit" button in dev mode, **When** clicked, **Then** it navigates to `/editor?id={postId}`
- [ ] **Given** the editor, **When** accessed from post detail, **Then** the post is loaded for editing (existing behavior preserved)

---

### FR-8: Redirects from Old URLs

#### FR-8.1: /blog Redirect
- [ ] **Given** the user navigates to `/blog`, **When** the request is processed, **Then** they are redirected to `/?tab=blog` (HTTP 301)
- [ ] **Given** the redirect from `/blog`, **When** completed, **Then** the "Blog" tab is active
- [ ] **Given** search engine crawlers, **When** they access `/blog`, **Then** they receive 301 redirect to `/?tab=blog`

#### FR-8.2: Old Post URL Redirect (Optional - Design Decision Needed)
- [ ] **Decision Required**: Should `/posts/[slug]` redirect to `/posts?id={slug}` or result in 404?
- [ ] **If redirect implemented**: **Given** the user navigates to `/posts/my-post-slug`, **When** the request is processed, **Then** they are redirected to `/posts?id=my-post-slug` (HTTP 301)
- [ ] **If no redirect**: **Given** the user navigates to `/posts/my-post-slug`, **When** the request is processed, **Then** they receive a 404 error

---

## Non-Functional Requirements

### NFR-1: Performance

#### NFR-1.1: Load Times
- [ ] **Given** initial page load, **When** measured with Lighthouse, **Then** First Contentful Paint (FCP) is under 1.5 seconds
- [ ] **Given** initial page load, **When** measured with Lighthouse, **Then** Largest Contentful Paint (LCP) is under 2.5 seconds
- [ ] **Given** initial page load, **When** measured with Lighthouse, **Then** Time to Interactive (TTI) is under 3.5 seconds
- [ ] **Given** tab switching, **When** the user clicks a tab, **Then** content appears within 100ms (instant feel)

#### NFR-1.2: Tab Switch Performance
- [ ] **Given** tab switching, **When** transitioning between tabs, **Then** no full page reload occurs (client-side navigation)
- [ ] **Given** tab switching, **When** transitioning, **Then** no layout shift occurs (CLS score = 0)
- [ ] **Given** tab switching on mobile, **When** transitioning, **Then** interaction feels smooth (no jank, 60fps)

#### NFR-1.3: Build Performance
- [ ] **Given** static export build, **When** running `npm run build`, **Then** build completes successfully
- [ ] **Given** static export, **When** deployed to GitHub Pages, **Then** all routes are accessible
- [ ] **Given** static export, **When** built, **Then** query parameter routing works correctly (JavaScript-based routing)
- [ ] **Given** build output, **When** analyzed, **Then** bundle size does not increase by more than 10KB compared to current implementation

---

### NFR-2: Accessibility (WCAG 2.1 Level AA)

#### NFR-2.1: ARIA Implementation
- [ ] **Given** the tab navigation, **When** rendered, **Then** it has `role="tablist"` on the container element
- [ ] **Given** each tab, **When** rendered, **Then** it has `role="tab"` attribute
- [ ] **Given** each tab panel (content area), **When** rendered, **Then** it has `role="tabpanel"` attribute
- [ ] **Given** the active tab, **When** rendered, **Then** it has `aria-selected="true"` attribute
- [ ] **Given** inactive tabs, **When** rendered, **Then** they have `aria-selected="false"` attribute
- [ ] **Given** each tab, **When** rendered, **Then** it has `aria-controls` pointing to the associated tabpanel ID
- [ ] **Given** each tabpanel, **When** rendered, **Then** it has `aria-labelledby` pointing to the associated tab ID
- [ ] **Given** the active tab, **When** rendered, **Then** it has `tabindex="0"`
- [ ] **Given** inactive tabs, **When** rendered, **Then** they have `tabindex="-1"`

#### NFR-2.2: Keyboard Navigation
- [ ] **Given** the user tabs to the tab list, **When** focus enters, **Then** focus goes to the currently active tab
- [ ] **Given** focus is on a tab, **When** the user presses `Right Arrow`, **Then** focus moves to the next tab (with wrapping)
- [ ] **Given** focus is on a tab, **When** the user presses `Left Arrow`, **Then** focus moves to the previous tab (with wrapping)
- [ ] **Given** focus is on a tab, **When** the user presses `Home`, **Then** focus moves to the first tab
- [ ] **Given** focus is on a tab, **When** the user presses `End`, **Then** focus moves to the last tab
- [ ] **Given** focus is on a tab, **When** the user presses `Enter` or `Space`, **Then** the tab activates and shows its panel (manual activation pattern)
- [ ] **Given** focus is on a tab, **When** the user presses `Down Arrow` or `Up Arrow`, **Then** browser default scrolling is preserved (horizontal tab list)
- [ ] **Given** the user tabs past the tab list, **When** tabbing forward, **Then** focus moves to the first focusable element in the active tabpanel

#### NFR-2.3: Screen Reader Support
- [ ] **Given** a screen reader user navigates the page, **When** encountering the tab list, **Then** the screen reader announces "tab list" or equivalent
- [ ] **Given** a screen reader user focuses a tab, **When** announced, **Then** it includes: tab name, position (e.g., "1 of 2"), and selected state
- [ ] **Given** a screen reader user activates a tab, **When** the panel appears, **Then** the screen reader announces the panel content or label
- [ ] **Given** all interactive elements, **When** focused, **Then** they have accessible labels (buttons use `<button>` elements)

#### NFR-2.4: Color Contrast
- [ ] **Given** all text in the interface, **When** measured, **Then** color contrast ratio is at least 4.5:1 for normal text (WCAG AA)
- [ ] **Given** all large text (18pt+), **When** measured, **Then** color contrast ratio is at least 3:1 (WCAG AA)
- [ ] **Given** focus indicators, **When** measured, **Then** color contrast ratio is at least 3:1 against adjacent colors

---

### NFR-3: SEO

#### NFR-3.1: Metadata
- [ ] **Given** the page at `/`, **When** accessed with "About" tab, **Then** meta title is "Jake Park - Software Engineer"
- [ ] **Given** the page at `/?tab=blog`, **When** accessed with "Blog" tab, **Then** meta title is "Blog - Jake Park"
- [ ] **Given** the page at `/`, **When** accessed, **Then** meta description describes the About page content
- [ ] **Given** the page at `/?tab=blog`, **When** accessed, **Then** meta description describes the Blog content
- [ ] **Given** any page state, **When** Open Graph tags are rendered, **Then** they reflect the current tab's content

#### NFR-3.2: Canonical URLs
- [ ] **Given** the page at `/`, **When** rendered, **Then** canonical URL is set to `https://thirdcommit.com/`
- [ ] **Given** the page at `/?tab=blog`, **When** rendered, **Then** canonical URL is set to `https://thirdcommit.com/` (query params stripped)
- [ ] **Given** the page at `/?tab=blog&utm_source=twitter`, **When** rendered, **Then** canonical URL is `https://thirdcommit.com/` (all query params stripped)
- [ ] **Given** a post detail page, **When** rendered, **Then** canonical URL is `https://thirdcommit.com/posts?id={slug}` or `https://thirdcommit.com/posts/{slug}` (based on final decision)

#### NFR-3.3: Sitemap
- [ ] **Given** the sitemap generation, **When** built, **Then** it includes: `/` (About page)
- [ ] **Given** the sitemap generation, **When** built, **Then** it does NOT include `/?tab=blog` (duplicate of `/`)
- [ ] **Given** the sitemap generation, **When** built, **Then** it includes all published post URLs: `/posts?id={slug}`
- [ ] **Given** the sitemap generation, **When** built, **Then** all URLs use the canonical form (no query parameters for main pages)

#### NFR-3.4: Social Sharing
- [ ] **Given** the page at `/?tab=blog`, **When** shared on social media, **Then** the preview shows Blog-specific metadata
- [ ] **Given** a post detail page, **When** shared on social media, **Then** the preview shows the post title, description, and image (if available)

---

### NFR-4: Responsive Design

#### NFR-4.1: Mobile Layout (< 768px)
- [ ] **Given** mobile viewport, **When** the page renders, **Then** the layout matches Figma mobile designs
- [ ] **Given** mobile viewport, **When** tabs are displayed, **Then** they stack or scroll horizontally per Figma (no dropdown)
- [ ] **Given** mobile viewport, **When** project/post cards render, **Then** they are displayed in a single column
- [ ] **Given** mobile viewport, **When** the navigation header renders, **Then** it adapts to mobile layout per Figma

#### NFR-4.2: Tablet Layout (768px - 1024px)
- [ ] **Given** tablet viewport, **When** the page renders, **Then** the layout is responsive and readable
- [ ] **Given** tablet viewport, **When** project/post cards render, **Then** they are displayed in a 2-column grid
- [ ] **Given** tablet viewport, **When** tabs are displayed, **Then** they use the same layout as desktop (horizontal tabs)

#### NFR-4.3: Desktop Layout (> 1024px)
- [ ] **Given** desktop viewport, **When** the page renders, **Then** the layout matches Figma web designs
- [ ] **Given** desktop viewport, **When** project/post cards render, **Then** they are displayed in a multi-column grid (as per current layout)
- [ ] **Given** desktop viewport, **When** the profile section renders on About tab, **Then** it uses the 2-column layout (profile left, projects right)

---

### NFR-5: Browser Compatibility

#### NFR-5.1: Modern Browser Support
- [ ] **Given** Chrome (last 2 versions), **When** the application runs, **Then** all features work correctly
- [ ] **Given** Firefox (last 2 versions), **When** the application runs, **Then** all features work correctly
- [ ] **Given** Safari (last 2 versions), **When** the application runs, **Then** all features work correctly
- [ ] **Given** Edge (last 2 versions), **When** the application runs, **Then** all features work correctly
- [ ] **Given** mobile Safari (iOS 15+), **When** the application runs, **Then** all features work correctly
- [ ] **Given** mobile Chrome (Android 12+), **When** the application runs, **Then** all features work correctly

#### NFR-5.2: Graceful Degradation
- [ ] **Given** JavaScript is disabled, **When** the user visits `/`, **Then** content is visible (About tab content)
- [ ] **Given** JavaScript is disabled, **When** the user visits `/?tab=blog`, **Then** Blog tab content is visible (server-rendered)
- [ ] **Given** older browsers without full ES6 support, **When** the application loads, **Then** core functionality works (with transpilation)

---

## Technical Requirements

### TR-1: Architecture

#### TR-1.1: Component Structure (TIER 1 - Volatile)
- [ ] **Given** the tab navigation component, **When** implemented, **Then** it is a client component (`'use client'` directive)
- [ ] **Given** the tab navigation component, **When** implemented, **Then** it uses `useSearchParams()` from `next/navigation`
- [ ] **Given** the tab navigation component, **When** implemented, **Then** it uses `useRouter().push()` for navigation
- [ ] **Given** the unified page, **When** implemented, **Then** it is located at `app/page.tsx` (replaces current landing page)
- [ ] **Given** the unified page layout, **When** implemented, **Then** it wraps tab content in a common layout structure

#### TR-1.2: Client/Server Boundaries
- [ ] **Given** the About tab content, **When** implemented, **Then** it is server-rendered with projects fetched server-side
- [ ] **Given** the Blog tab content, **When** implemented, **Then** it is server-rendered with posts fetched server-side
- [ ] **Given** the tab switcher UI, **When** implemented, **Then** it is a client component that manages URL state
- [ ] **Given** data fetching, **When** implemented, **Then** it uses React Server Components where possible (no client-side fetching for initial render)

#### TR-1.3: Route Structure
- [ ] **Given** the application routes, **When** implemented, **Then** `/app/page.tsx` contains the unified tabbed interface
- [ ] **Given** the application routes, **When** implemented, **Then** `/app/(with-nav)/blog/page.tsx` is removed or redirects to `/?tab=blog`
- [ ] **Given** the application routes, **When** implemented, **Then** `/app/(with-nav)/posts/[slug]/page.tsx` is moved to `/app/posts/page.tsx` (using query params)
- [ ] **Given** the navigation header, **When** implemented, **Then** it is moved out of `(with-nav)` route group to apply to all pages
- [ ] **Given** the navigation header, **When** implemented, **Then** "Write" menu item checks `process.env.NODE_ENV === 'development'`

---

### TR-2: Data Models

#### TR-2.1: Project Entity
```typescript
// src/domain/projects/entities/project.entity.ts
export interface Project {
  title: string
  description: string
  externalLink?: string  // Optional external URL
}
```
- [ ] **Given** the Project entity, **When** defined, **Then** it matches the above interface
- [ ] **Given** the Project entity, **When** used, **Then** it does NOT include: id, slug, dates, readingTime, tags

#### TR-2.2: Project Repository Port
```typescript
// src/domain/projects/ports/project-repository.port.ts
export interface IProjectRepository {
  getProjects(): Promise<Project[]>
}
```
- [ ] **Given** the IProjectRepository interface, **When** defined, **Then** it matches the above contract
- [ ] **Given** the InMemoryProjectRepository, **When** implemented, **Then** it implements IProjectRepository

---

### TR-3: API Contracts

#### TR-3.1: Projects Use Case Signature
```typescript
// src/domain/projects/use-cases/get-projects.use-case.ts
export async function getProjectsUseCase(
  repository: IProjectRepository
): Promise<Project[]>
```
- [ ] **Given** the getProjectsUseCase, **When** defined, **Then** it matches the above signature
- [ ] **Given** the getProjectsUseCase, **When** called, **Then** it returns all projects from the repository

#### TR-3.2: Projects Public API
```typescript
// src/domain/projects/index.ts
export type { Project } from './entities/project.entity'
export { getProjectsUseCase } from './use-cases/get-projects.use-case'
export type { IProjectRepository } from './ports/project-repository.port'

import type { IProjectRepository } from './ports/project-repository.port'
import { getProjectsUseCase } from './use-cases/get-projects.use-case'

export function createProjectsApi(repository: IProjectRepository) {
  return {
    getProjects: () => getProjectsUseCase(repository),
  }
}
```
- [ ] **Given** the projects public API, **When** exported, **Then** it follows the barrel export pattern above
- [ ] **Given** the projects API, **When** consumed, **Then** consumers import from `@/domain/projects` (not internal files)

---

### TR-4: Technology Choices

#### TR-4.1: Component Implementation
- [ ] **Given** tab buttons, **When** implemented, **Then** they use `<button>` elements with `role="tab"` (semantic HTML)
- [ ] **Given** the tab component, **When** implemented, **Then** it uses existing `Button` component from `app/_components/button.tsx`
- [ ] **Given** project cards, **When** implemented, **Then** they use existing `Card` component from `app/_components/card.tsx`
- [ ] **Given** post cards, **When** implemented, **Then** they reuse existing `PostCard` from `app/(with-nav)/blog/_components/post-card.tsx`

#### TR-4.2: Styling Approach
- [ ] **Given** all new components, **When** styled, **Then** they use Tailwind CSS classes exclusively
- [ ] **Given** the migration, **When** completed, **Then** `app/page.css` is deleted
- [ ] **Given** custom styles from `page.css`, **When** migrated, **Then** they are converted to Tailwind utility classes or component CSS
- [ ] **Given** the profile section, **When** styled, **Then** the dashed border effect is replicated with Tailwind (or minimal custom CSS if necessary)

#### TR-4.3: URL Management
- [ ] **Given** tab navigation, **When** implemented, **Then** it uses `useSearchParams()` to read current tab
- [ ] **Given** tab navigation, **When** switching tabs, **Then** it uses `router.push()` to update URL
- [ ] **Given** URL updates, **When** tab switches, **Then** history entries are pushed (not replaced) for browser back support

---

## Error Scenarios & Edge Cases

### ES-1: Invalid Tab Parameter
- [ ] **Given** the user visits `/?tab=invalid`, **When** the page renders, **Then** the default "About" tab is shown
- [ ] **Given** the user visits `/?tab=`, **When** the page renders, **Then** the default "About" tab is shown (empty value)
- [ ] **Given** the user visits `/?tab=BLOG` (uppercase), **When** the page renders, **Then** the "Blog" tab is shown (case-insensitive handling)

### ES-2: Missing Data
- [ ] **Given** the projects repository returns empty array, **When** About tab renders, **Then** an appropriate empty state is shown
- [ ] **Given** the blog repository returns empty array, **When** Blog tab renders, **Then** an appropriate empty state is shown
- [ ] **Given** a project is missing a description, **When** the card renders, **Then** it displays without breaking layout
- [ ] **Given** a project is missing an externalLink, **When** the card renders, **Then** it is displayed as non-clickable content

### ES-3: Network Failures (Client-Side Navigation)
- [ ] **Given** client-side navigation fails, **When** switching tabs, **Then** an error boundary catches the error
- [ ] **Given** an error boundary is triggered, **When** displayed, **Then** the user sees a friendly error message
- [ ] **Given** an error boundary is shown, **When** the user clicks retry, **Then** the action is retried

### ES-4: Static Export Edge Cases
- [ ] **Given** static export build, **When** accessing `/?tab=blog` directly, **Then** JavaScript correctly activates the Blog tab on load
- [ ] **Given** static export on GitHub Pages, **When** the user refreshes on `/?tab=blog`, **Then** the page loads correctly (fallback to index.html)
- [ ] **Given** static export, **When** the user navigates to `/posts?id=my-slug`, **Then** the query parameter is correctly parsed
- [ ] **Given** static export, **When** a post with special characters in slug is accessed, **Then** URL encoding/decoding works correctly

### ES-5: Browser History Edge Cases
- [ ] **Given** the user navigates: Home → Blog → Post → Back → Back, **When** clicking back twice, **Then** they return to Blog tab, then About tab
- [ ] **Given** the user opens `/?tab=blog` in new tab, **When** they click browser back, **Then** no navigation occurs (no history)
- [ ] **Given** the user uses browser forward after going back, **When** clicking forward, **Then** they move forward through tab history correctly

### ES-6: URL Parameter Conflicts
- [ ] **Given** the URL is `/?tab=blog&tab=about`, **When** the page renders, **Then** the first tab parameter is used (or last, based on implementation decision)
- [ ] **Given** the URL contains other query parameters `/?foo=bar&tab=blog`, **When** the page renders, **Then** the Blog tab is active and other params are preserved
- [ ] **Given** the URL changes via tab navigation, **When** other query params exist, **Then** they are preserved in the new URL

### ES-7: Accessibility Edge Cases
- [ ] **Given** keyboard navigation, **When** the last tab is focused and user presses Right Arrow, **Then** focus wraps to the first tab
- [ ] **Given** keyboard navigation, **When** the first tab is focused and user presses Left Arrow, **Then** focus wraps to the last tab
- [ ] **Given** screen reader mode, **When** tab content changes, **Then** the screen reader announces the change (ARIA live region if needed)
- [ ] **Given** a user with motion sensitivity, **When** tabs switch, **Then** no unnecessary animations are triggered (`prefers-reduced-motion` respected)

### ES-8: Mobile Device Edge Cases
- [ ] **Given** mobile Safari, **When** the user taps a tab, **Then** the 300ms click delay is avoided (touch events handled correctly)
- [ ] **Given** mobile devices, **When** tabs overflow horizontally, **Then** they are scrollable with proper touch handling
- [ ] **Given** mobile keyboard is open, **When** tab navigation occurs, **Then** the keyboard does not interfere with content visibility

---

## Test Coverage Requirements

### TCR-1: Unit Tests
- [ ] **Given** the `getProjectsUseCase`, **When** tested, **Then** it has 100% code coverage
- [ ] **Given** the `InMemoryProjectRepository`, **When** tested, **Then** it returns the expected hardcoded projects
- [ ] **Given** the tab URL parameter logic, **When** tested, **Then** all valid/invalid cases are covered

### TCR-2: Integration Tests
- [ ] **Given** the unified page component, **When** tested, **Then** tab switching behavior is verified
- [ ] **Given** the unified page component, **When** tested, **Then** URL synchronization is verified
- [ ] **Given** the navigation header, **When** tested, **Then** "Write" menu visibility logic is verified (dev vs prod)

### TCR-3: E2E Tests
- [ ] **Given** the full application, **When** E2E tested, **Then** the complete user flow is tested: Home → Blog → Post → Back
- [ ] **Given** the full application, **When** E2E tested, **Then** direct URL access scenarios are tested (`/`, `/?tab=blog`, `/posts?id=slug`)
- [ ] **Given** the full application, **When** E2E tested, **Then** redirects from old URLs are verified (`/blog` → `/?tab=blog`)

---

## Definition of Done

A feature is considered **DONE** when:

1. All applicable acceptance criteria checkboxes are checked
2. Code passes all automated tests (unit, integration, E2E)
3. Code review is completed and approved
4. Lighthouse score meets performance thresholds (>90 for Performance, Accessibility, Best Practices, SEO)
5. Manual testing confirms Figma design adherence on mobile and desktop
6. Static export build succeeds and deploys to GitHub Pages
7. All redirects are tested and working
8. Accessibility audit passes (axe DevTools, manual keyboard navigation, screen reader testing)
9. Documentation is updated (if applicable)
10. No regressions in existing blog and editor features

---

## Open Questions Requiring Decisions

1. **Q1**: Should `/posts/[slug]` redirect to `/posts?id={slug}` or return 404?
   - **Impact**: External links, SEO, bookmarks
   - **Recommendation**: Implement 301 redirect for backward compatibility

2. **Q2**: Should tab selection persist across sessions using localStorage?
   - **Impact**: User experience vs. URL as source of truth
   - **Recommendation**: URL is source of truth, no localStorage

3. **Q3**: Should URL changes be pushed or replaced in history?
   - **Impact**: Browser back button behavior
   - **Recommendation**: Push (already specified above)

4. **Q4**: Should tab switching trigger automatic activation or manual activation (Space/Enter)?
   - **Impact**: Accessibility pattern choice
   - **Recommendation**: Manual activation per W3C best practices (specified above)

5. **Q5**: Should the canonical URL for `/?tab=blog` be `/` or a separate `/blog` page in sitemap?
   - **Impact**: SEO, duplicate content
   - **Recommendation**: Canonical is `/` (specified above)

---

## Version History

| Version | Date       | Changes                                  |
|---------|------------|------------------------------------------|
| 1.0     | 2025-10-07 | Initial acceptance criteria generated    |
