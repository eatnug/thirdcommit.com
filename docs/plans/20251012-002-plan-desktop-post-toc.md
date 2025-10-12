# 20251012-002-PLAN: Desktop Post Table of Contents (ToC)

**Created**: 2025-10-12
**Status**: PLAN
**Based on**: [20251012-002-spec-desktop-post-toc.md](../specs/20251012-002-spec-desktop-post-toc.md)

## Architecture Design

### Overview

Client-side Table of Contents implementation for desktop post detail pages. The feature uses position-based heading ID generation during markdown-to-HTML conversion, followed by client-side parsing of the rendered HTML to build a navigable ToC structure. Active section highlighting is powered by the Intersection Observer API for optimal performance.

**Key Architectural Decisions**:
- **Server-side ID injection**: Heading IDs generated during markdown parsing (build-time/SSG)
- **Client-side ToC parsing**: ToC data extracted from rendered HTML (runtime)
- **Position-based IDs**: Uses `heading-{index}` format to avoid Korean/Unicode slugification issues
- **Intersection Observer**: Efficient scroll tracking without manual event listeners
- **CSS Sticky Positioning**: Native browser support, no JavaScript scroll calculations

### System Components

#### Infrastructure Layer (Modified)

**MarkdownService** (`src/domain/blog/services/markdown.service.ts`)
- **Responsibility**: Convert markdown to HTML with heading IDs
- **Modification**: Add custom `marked.Renderer` for heading elements
- **Output**: HTML string with `id` attributes on all `h1`, `h2`, `h3` elements
- **ID Generation**: Sequential position-based (`heading-0`, `heading-1`, ...)

#### Presentation Layer (New)

**1. TableOfContents Component** (`src/presentation/components/TableOfContents.tsx`)
- Main component rendering the ToC sidebar
- **Props**: `{ htmlContent: string }`
- **Responsibilities**:
  - Parse HTML to extract ToC structure (memoized)
  - Render nested list with proper hierarchy
  - Handle click events for smooth scrolling
  - Track and display active section
  - Apply styling per heading level

**2. Utility Functions** (`src/presentation/components/TableOfContents.utils.ts`)
- `parseToc(htmlContent: string): TocItem[]`
  - Creates temporary DOM element from HTML string
  - Queries all `h1`, `h2`, `h3` elements
  - Extracts `id`, `textContent`, and level
  - Builds nested structure (h3 under parent h2)
  - Returns structured array

**3. Custom Hook** (`src/presentation/components/TableOfContents.hooks.ts`)
- `useActiveHeading(headingIds: string[]): string | null`
  - Creates Intersection Observer with optimized root margin
  - Observes all heading elements
  - Returns ID of topmost visible heading
  - Cleans up observer on unmount

#### PostDetailPage (Modified)

**Layout Changes** (`src/presentation/pages/post-detail/PostDetailPage.tsx`)
- Replace full-width content layout with centered content + sidebar
- Add ToC component in right sidebar (desktop only)
- Responsive behavior: ToC visible ≥1280px, hidden <1280px

### Data Flow

#### Build-Time Flow (Heading ID Generation)
```
Markdown File (.md)
  ↓
MarkdownService.toHtml()
  ├─ Initialize heading counter (let headingIndex = 0)
  ├─ marked.parse() with custom renderer
  │   ├─ renderer.heading() intercepts h1/h2/h3
  │   ├─ Generate ID: `heading-${headingIndex++}`
  │   └─ Return: `<h${depth} id="${id}">${text}</h${depth}>`
  ├─ shiki.codeToHtml() for syntax highlighting
  ├─ DOMPurify.sanitize() for XSS protection
  ↓
Post.html (HTML string with embedded heading IDs)
  ↓
Static JSON generation (build-static-data.mjs)
  ↓
posts.json (includes HTML with heading IDs)
```

#### Runtime Flow (ToC Rendering & Navigation)
```
User navigates to post detail page
  ↓
PostDetailPage loads post data from static JSON
  ↓
Render post HTML (dangerouslySetInnerHTML)
  ↓
TableOfContents component mounts
  ├─ parseToc(htmlContent) extracts headings
  │   ├─ Create temporary DOM: document.createElement('div')
  │   ├─ Set innerHTML to post HTML
  │   ├─ Query: querySelectorAll('h1, h2, h3')
  │   ├─ Build TocItem[] with nested structure
  │   └─ Return: [{ level, text, id, children }]
  ├─ useMemo caches parsed result
  ├─ Render nested list with links
  ↓
useActiveHeading hook initializes
  ├─ Create IntersectionObserver
  │   ├─ rootMargin: '-100px 0px -50%'
  │   ├─ Observe all heading elements by ID
  │   └─ Track visible headings
  ├─ Determine topmost visible heading
  ├─ Update active heading state
  └─ Apply active styling to ToC item
  ↓
User clicks ToC item
  ├─ Prevent default anchor behavior (preventDefault)
  ├─ Find target heading element by ID
  ├─ Call scrollIntoView({ behavior: 'smooth', block: 'start' })
  ├─ Update URL hash (window.location.hash)
  └─ Intersection Observer detects new active section
```

### Architecture Diagram (Text)
```
┌─────────────────────────────────────────────────────────────────┐
│                     Build-Time (SSG/Next.js)                     │
│  ┌──────────────────┐      ┌──────────────────────────────────┐ │
│  │ Markdown Files   │─────▶│ MarkdownService                  │ │
│  │ (*.md)           │      │ - Custom marked.Renderer         │ │
│  └──────────────────┘      │ - Inject heading IDs             │ │
│                             │   (heading-0, heading-1, ...)    │ │
│                             └──────────┬───────────────────────┘ │
│                                        │                          │
│                                        ▼                          │
│                             ┌──────────────────────────────────┐ │
│                             │ Post HTML (with heading IDs)     │ │
│                             └──────────┬───────────────────────┘ │
│                                        │                          │
│                                        ▼                          │
│                             ┌──────────────────────────────────┐ │
│                             │ Static JSON (posts.json)         │ │
│                             └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Deployed to production
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Runtime (Browser)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PostDetailPage                         │   │
│  │  ┌───���─────────────────────┐  ┌────────────────────────┐ │   │
│  │  │ Article Content         │  │ TableOfContents        │ │   │
│  │  │ (dangerouslySetInnerHTML)│  │ (Sidebar, Desktop)     │ │   │
│  │  │                         │  │                        │ │   │
│  │  │ <h1 id="heading-0">     │  │ ┌──────────────────┐   │ │   │
│  │  │ <h2 id="heading-1">     │◀─┼─┤ parseToc()       │   │ │   │
│  │  │ <h3 id="heading-2">     │  │ │ (extract IDs)    │   │ │   │
│  │  │ ...                     │  │ └──────────────────┘   │ │   │
│  │  └─────────────────────────┘  │                        │ │   │
│  │             │                  │ ┌──────────────────┐   │ │   │
│  │             │                  │ │ useActiveHeading │   │ │   │
│  │             └──────────────────┼▶│ (Intersection    │   │ │   │
│  │                                │ │  Observer)       │   │ │   │
│  │                                │ └──────────────────┘   │ │   │
│  │                                │                        │ │   │
│  │                                │ ┌──────────────────┐   │ │   │
│  │                                │ │ Click → Smooth   │   │ │   │
│  │                                │ │ Scroll to Section│   │ │   │
│  │                                │ └──────────────────┘   │ │   │
│  │                                └────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Models

#### TocItem Interface
```typescript
/**
 * Represents a single item in the Table of Contents
 */
interface TocItem {
  /** Heading level (1 = h1, 2 = h2, 3 = h3) */
  level: 1 | 2 | 3;

  /** Plain text content of the heading (HTML stripped) */
  text: string;

  /** Unique anchor ID (e.g., "heading-0") */
  id: string;

  /** Nested child headings (h3 under h2) */
  children?: TocItem[];
}
```

#### Example ToC Data Structure
```typescript
// Input HTML:
// <h1 id="heading-0">How to Build a Blog</h1>
// <h2 id="heading-1">Introduction</h2>
// <h3 id="heading-2">Why React?</h3>
// <h3 id="heading-3">Prerequisites</h3>
// <h2 id="heading-4">Getting Started</h2>

// Parsed ToC:
[
  {
    level: 1,
    text: "How to Build a Blog",
    id: "heading-0",
    children: []
  },
  {
    level: 2,
    text: "Introduction",
    id: "heading-1",
    children: [
      {
        level: 3,
        text: "Why React?",
        id: "heading-2",
        children: []
      },
      {
        level: 3,
        text: "Prerequisites",
        id: "heading-3",
        children: []
      }
    ]
  },
  {
    level: 2,
    text: "Getting Started",
    id: "heading-4",
    children: []
  }
]
```

---

## API Contract

**No API changes required** - This is a client-side only feature. All data flows through existing static JSON generation pipeline.

---

## Task Breakdown

### Phase 1: Core Infrastructure

#### 20251012-002-T1: Modify MarkdownService to Inject Heading IDs
**Complexity**: M
**Description**: Update markdown-to-HTML conversion to automatically add position-based IDs to all h1, h2, h3 elements
**Dependencies**: None
**Location**: [src/domain/blog/services/markdown.service.ts](../../src/domain/blog/services/markdown.service.ts)

**Acceptance Criteria**:
- [ ] Custom `marked.Renderer` implemented for heading elements
- [ ] Heading counter tracks position (starts at 0, increments sequentially)
- [ ] Generated IDs follow format: `heading-{index}`
- [ ] IDs injected for h1, h2, h3 only (ignore h4, h5, h6)
- [ ] Existing markdown processing (shiki, DOMPurify) unchanged
- [ ] No collision with existing element IDs

**Implementation Steps**:
1. Import `marked.Renderer` from marked library
2. Create custom renderer instance before `marked.parse()`
3. Initialize heading counter: `let headingIndex = 0`
4. Override `renderer.heading()` method:
   - Parse tokens to get heading text
   - Generate ID: `heading-${headingIndex++}`
   - Return formatted HTML: `<h${depth} id="${id}">${text}</h${depth}>\n`
5. Register renderer with `marked.use({ renderer })`
6. Test with sample markdown containing Korean headings

**Testing**:
- Unit test: Markdown with 5 headings → HTML has `heading-0` to `heading-4`
- Unit test: Duplicate heading text → Different IDs (no collision)
- Unit test: Korean heading text → ID still works (position-based)
- Integration test: Build static data → posts.json includes heading IDs

---

#### 20251012-002-T2: Create ToC Parsing Utility
**Complexity**: M
**Description**: Implement client-side utility to extract ToC structure from HTML
**Dependencies**: None (can run parallel with T1)
**Location**: `src/presentation/components/TableOfContents.utils.ts` (new file)

**Acceptance Criteria**:
- [ ] Function signature: `parseToc(htmlContent: string): TocItem[]`
- [ ] Extracts all h1, h2, h3 elements from HTML string
- [ ] Builds nested structure (h3 under parent h2)
- [ ] Strips HTML tags from heading text (uses `textContent`)
- [ ] Handles empty headings gracefully (skips them)
- [ ] Returns empty array if no headings found
- [ ] Pure function (no side effects, testable)

**Implementation Steps**:
1. Create temporary DOM element: `document.createElement('div')`
2. Set innerHTML: `div.innerHTML = htmlContent`
3. Query headings: `div.querySelectorAll('h1, h2, h3')`
4. Iterate through headings and extract:
   - `level`: Parse from `tagName` (H1 → 1, H2 → 2, H3 → 3)
   - `text`: Get `element.textContent.trim()`
   - `id`: Get `element.id`
5. Build nested structure:
   - Track current h2 parent
   - If h3 encountered, add to parent's `children` array
   - If h2 encountered, create new parent
6. Return flat/nested array of `TocItem` objects

**Testing**:
- Unit test: HTML with 3 headings → Returns 3 TocItem objects
- Unit test: Nested h3 under h2 → Correct children array
- Unit test: Empty HTML → Returns empty array
- Unit test: Heading with `<code>` tag → Text is plain (no HTML)
- Unit test: Missing heading ID → Gracefully handle (skip or warn)

---

#### 20251012-002-T3: Create useActiveHeading Hook
**Complexity**: L
**Description**: Implement Intersection Observer hook to track currently visible heading
**Dependencies**: None (can run parallel with T1, T2)
**Location**: `src/presentation/components/TableOfContents.hooks.ts` (new file)

**Acceptance Criteria**:
- [ ] Hook signature: `useActiveHeading(headingIds: string[]): string | null`
- [ ] Creates Intersection Observer on mount
- [ ] Observes all heading elements by ID
- [ ] Returns ID of topmost visible heading
- [ ] Updates state when active heading changes
- [ ] Cleans up observer on unmount
- [ ] Uses optimized root margin: `-100px 0px -50%`
- [ ] Handles edge cases (no headings visible, multiple visible)

**Implementation Steps**:
1. Create state: `const [activeId, setActiveId] = useState<string | null>(null)`
2. Use `useEffect` to initialize Intersection Observer:
   ```typescript
   const observer = new IntersectionObserver(
     (entries) => {
       // Find all visible entries
       const visibleEntries = entries.filter(e => e.isIntersecting)

       // Get topmost visible heading (first in array)
       if (visibleEntries.length > 0) {
         const topEntry = visibleEntries.reduce((top, current) =>
           current.boundingClientRect.top < top.boundingClientRect.top ? current : top
         )
         setActiveId(topEntry.target.id)
       } else {
         setActiveId(null)
       }
     },
     {
       rootMargin: '-100px 0px -50%', // Top 100px offset, bottom 50% threshold
       threshold: 0
     }
   )
   ```
3. Observe all heading elements:
   ```typescript
   headingIds.forEach(id => {
     const element = document.getElementById(id)
     if (element) observer.observe(element)
   })
   ```
4. Cleanup on unmount:
   ```typescript
   return () => observer.disconnect()
   ```
5. Return `activeId`

**Testing**:
- Unit test (jsdom): Creates observer with correct options
- Unit test: Observes all heading elements
- Unit test: Cleans up observer on unmount
- Integration test (Cypress): Scroll page → Active heading updates in ToC

---

### Phase 2: ToC Component

#### 20251012-002-T4: Build TableOfContents Component (Basic Rendering)
**Complexity**: M
**Description**: Create ToC component with basic rendering (no interactivity yet)
**Dependencies**: T2 (needs parseToc utility)
**Location**: `src/presentation/components/TableOfContents.tsx` (new file)

**Acceptance Criteria**:
- [ ] Component receives `htmlContent: string` prop
- [ ] Parses ToC using `parseToc()` utility (memoized with `useMemo`)
- [ ] Renders nested list structure (`<nav>` + `<ol>` + `<li>`)
- [ ] Shows heading text for each item
- [ ] Displays hierarchy visually (h1/h2/h3 with proper indentation)
- [ ] Renders `<a>` links with `href="#heading-{id}"`
- [ ] Returns null if no headings found (empty state)
- [ ] Uses semantic HTML for accessibility

**Implementation Steps**:
1. Create component with TypeScript interface:
   ```typescript
   interface TableOfContentsProps {
     htmlContent: string;
   }

   export const TableOfContents: React.FC<TableOfContentsProps> = ({ htmlContent }) => {
     // Implementation
   }
   ```
2. Parse ToC with memoization:
   ```typescript
   const tocItems = useMemo(() => parseToc(htmlContent), [htmlContent])
   ```
3. Early return if empty:
   ```typescript
   if (tocItems.length === 0) return null
   ```
4. Render structure:
   ```tsx
   <nav aria-label="Table of Contents">
     <ol>
       {tocItems.map(item => (
         <li key={item.id}>
           <a href={`#${item.id}`}>{item.text}</a>
           {item.children && item.children.length > 0 && (
             <ol>
               {item.children.map(child => (
                 <li key={child.id}>
                   <a href={`#${child.id}`}>{child.text}</a>
                 </li>
               ))}
             </ol>
           )}
         </li>
       ))}
     </ol>
   </nav>
   ```

**Testing**:
- Unit test: Renders correct number of items
- Unit test: Empty HTML → Returns null
- Unit test: Nested h3 → Renders nested `<ol>`
- Unit test: Links have correct `href` attributes

---

#### 20251012-002-T5: Add Smooth Scrolling to ToC Component
**Complexity**: S
**Description**: Implement click handler for smooth scrolling to sections
**Dependencies**: T4 (needs basic ToC component)
**Location**: [src/presentation/components/TableOfContents.tsx](../../src/presentation/components/TableOfContents.tsx)

**Acceptance Criteria**:
- [ ] Clicking ToC item scrolls smoothly to corresponding section
- [ ] Uses `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- [ ] Prevents default anchor link behavior (`preventDefault`)
- [ ] Updates URL hash (`window.location.hash`)
- [ ] Keyboard navigation supported (Enter key triggers scroll)
- [ ] No scroll if target element not found (error handling)

**Implementation Steps**:
1. Create click handler:
   ```typescript
   const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
     e.preventDefault()

     const element = document.getElementById(id)
     if (!element) {
       console.warn(`Heading element with id "${id}" not found`)
       return
     }

     element.scrollIntoView({ behavior: 'smooth', block: 'start' })

     // Update URL hash
     window.location.hash = id
   }
   ```
2. Attach handler to links:
   ```tsx
   <a href={`#${item.id}`} onClick={(e) => handleClick(e, item.id)}>
     {item.text}
   </a>
   ```
3. Add keyboard support (optional, browsers handle this by default for links)

**Testing**:
- Integration test (Cypress): Click ToC item → Page scrolls to section
- Integration test: URL hash updates after click
- Integration test: Keyboard navigation (Tab + Enter) → Scrolls

---

#### 20251012-002-T6: Integrate Active Heading Highlighting
**Complexity**: M
**Description**: Use useActiveHeading hook to highlight currently visible section
**Dependencies**: T3 (needs useActiveHeading hook), T4 (needs ToC component)
**Location**: [src/presentation/components/TableOfContents.tsx](../../src/presentation/components/TableOfContents.tsx)

**Acceptance Criteria**:
- [ ] Currently visible section highlighted in ToC
- [ ] Active item has distinct styling (blue text, bold)
- [ ] Smooth transition between active states (CSS transition)
- [ ] Inactive items have default styling (gray text)
- [ ] Active item has `aria-current="location"` attribute
- [ ] Handles edge cases (no section visible, rapid scrolling)

**Implementation Steps**:
1. Import and use hook:
   ```typescript
   const allHeadingIds = useMemo(() => {
     const ids: string[] = []
     tocItems.forEach(item => {
       ids.push(item.id)
       if (item.children) {
         item.children.forEach(child => ids.push(child.id))
       }
     })
     return ids
   }, [tocItems])

   const activeHeadingId = useActiveHeading(allHeadingIds)
   ```
2. Apply conditional styling:
   ```tsx
   <a
     href={`#${item.id}`}
     onClick={(e) => handleClick(e, item.id)}
     className={activeHeadingId === item.id ? 'active' : ''}
     aria-current={activeHeadingId === item.id ? 'location' : undefined}
   >
     {item.text}
   </a>
   ```
3. Define CSS classes (Tailwind):
   - Active: `text-blue-600 font-bold`
   - Inactive: `text-gray-600`
   - Transition: `transition-all duration-150 ease-in-out`

**Testing**:
- Integration test (Cypress): Scroll to section → ToC item becomes active
- Integration test: Active item has blue text and bold weight
- Integration test: Scrolling past section → Next item becomes active

---

### Phase 3: Styling & Layout

#### 20251012-002-T7: Style ToC Component per Design Spec
**Complexity**: M
**Description**: Apply Tailwind CSS styling to match Figma design
**Dependencies**: T6 (needs fully functional ToC component)
**Location**: [src/presentation/components/TableOfContents.tsx](../../src/presentation/components/TableOfContents.tsx)

**Acceptance Criteria**:
- [ ] ToC container: 250px width, sticky positioning, scrollable
- [ ] Heading level styles match spec:
  - h1: 16px, font-semibold (600), no indentation
  - h2: 14px, font-medium (500), no indentation
  - h3: 13px, font-normal (400), 16px left padding
- [ ] State-based styling:
  - Default: Gray (varies by level)
  - Hover: Darker gray + underline
  - Active: Blue text (`text-blue-600`) + bold
- [ ] Smooth transitions on state changes (150ms)
- [ ] Responsive: Visible ≥1280px, hidden <1280px
- [ ] No layout shift when ToC renders

**Implementation Steps**:
1. Container styles:
   ```tsx
   <nav
     aria-label="Table of Contents"
     className="sticky top-[20px] w-[250px] max-h-[calc(100vh-40px)] overflow-y-auto p-4"
   >
   ```
2. List styles (remove bullets):
   ```tsx
   <ol className="list-none space-y-2">
   ```
3. Link styles by level:
   ```tsx
   const getLinkClasses = (level: 1 | 2 | 3, isActive: boolean) => {
     const baseClasses = 'block transition-all duration-150 ease-in-out'

     const levelClasses = {
       1: 'text-base font-semibold',
       2: 'text-sm font-medium',
       3: 'text-xs font-normal pl-4'
     }[level]

     const stateClasses = isActive
       ? 'text-blue-600 font-bold'
       : level === 1
         ? 'text-gray-700 hover:text-gray-900 hover:underline'
         : level === 2
         ? 'text-gray-600 hover:text-gray-900 hover:underline'
         : 'text-gray-500 hover:text-gray-700 hover:underline'

     return `${baseClasses} ${levelClasses} ${stateClasses}`
   }

   <a
     href={`#${item.id}`}
     className={getLinkClasses(item.level, activeHeadingId === item.id)}
     onClick={(e) => handleClick(e, item.id)}
   >
     {item.text}
   </a>
   ```

**Testing**:
- Visual test: Compare with Figma design
- Test: Hover states work correctly
- Test: Active state applies bold + blue color
- Test: h3 items have 16px left padding (indented under h2)

---

#### 20251012-002-T8: Update PostDetailPage Layout
**Complexity**: M
**Description**: Integrate ToC into post detail page with responsive layout
**Dependencies**: T7 (needs styled ToC component)
**Location**: [src/presentation/pages/post-detail/PostDetailPage.tsx](../../src/presentation/pages/post-detail/PostDetailPage.tsx)

**Acceptance Criteria**:
- [ ] ToC displayed in right sidebar (desktop ≥1280px)
- [ ] ToC hidden on mobile and tablet (<1280px)
- [ ] Content area max-width ~700px, centered
- [ ] Layout uses flexbox for content + sidebar
- [ ] No horizontal overflow on narrow desktops
- [ ] Layout degrades gracefully below 1280px (ToC disappears, content expands)
- [ ] No layout shift when ToC loads

**Implementation Steps**:
1. Import TableOfContents component:
   ```typescript
   import { TableOfContents } from '../../components/TableOfContents'
   ```
2. Modify layout structure:
   ```tsx
   <div className="flex flex-col">
     {/* Existing header */}
     <Header />

     {/* New: Content + ToC Container */}
     <div className="flex justify-center gap-8 px-5 py-5">
       {/* Main Content */}
       <article className="prose prose-lg max-w-[700px] w-full">
         <h1>{post.title}</h1>
         <div dangerouslySetInnerHTML={{ __html: displayContent }} />
       </article>

       {/* ToC Sidebar (Desktop Only) */}
       <aside className="hidden xl:block w-[250px] shrink-0">
         <TableOfContents htmlContent={displayContent} />
       </aside>
     </div>
   </div>
   ```
3. Remove old padding classes:
   - **Old**: `px-4 md:px-[400px]`
   - **New**: Centered flex layout

**Testing**:
- Visual test: Desktop (≥1280px) → ToC visible on right
- Visual test: Tablet (768px-1279px) → ToC hidden, content centered
- Visual test: Mobile (<768px) → ToC hidden, content full-width
- Test: Resize browser → ToC appears/disappears at 1280px breakpoint
- Test: No horizontal scrollbar on 1280px window

---

### Phase 4: Edge Cases & Polish

#### 20251012-002-T9: Add Error Handling & Edge Cases
**Complexity**: S
**Description**: Handle edge cases gracefully (no headings, parse errors, missing IDs)
**Dependencies**: T8 (needs integrated ToC)
**Location**: Multiple files (utils, hooks, component)

**Acceptance Criteria**:
- [ ] Empty HTML → ToC returns null (no render)
- [ ] Parse error → Caught, logged, returns empty array
- [ ] Missing heading ID → Skipped, warning logged
- [ ] Very long heading text → Wraps properly (no overflow)
- [ ] Deep nesting (h4+) → Ignored (only h1/h2/h3 supported)
- [ ] Draft posts with placeholder → ToC handles gracefully

**Implementation Steps**:
1. Wrap `parseToc()` in try-catch:
   ```typescript
   export function parseToc(htmlContent: string): TocItem[] {
     try {
       // Existing logic
     } catch (error) {
       console.error('Error parsing ToC:', error)
       return []
     }
   }
   ```
2. Validate heading IDs:
   ```typescript
   const id = element.id
   if (!id) {
     console.warn('Heading element missing id attribute:', element.textContent)
     return // Skip this heading
   }
   ```
3. Add CSS for long text:
   ```tsx
   <a className="... overflow-wrap-break-word">
   ```

**Testing**:
- Test: Empty HTML → Component returns null
- Test: Malformed HTML → No crash, returns empty array
- Test: Heading without ID → Skipped, warning in console
- Test: 200-character heading → Text wraps, no horizontal overflow

---

#### 20251012-002-T10: Accessibility Enhancements
**Complexity**: M
**Description**: Ensure ToC meets WCAG 2.1 AA standards
**Dependencies**: T8 (needs integrated ToC)
**Location**: [src/presentation/components/TableOfContents.tsx](../../src/presentation/components/TableOfContents.tsx)

**Acceptance Criteria**:
- [ ] ToC wrapped in `<nav>` with `aria-label="Table of Contents"`
- [ ] Uses semantic list structure (`<ol>` + `<li>`)
- [ ] Links have accessible names (heading text)
- [ ] Active item has `aria-current="location"`
- [ ] Focus visible styles for keyboard users
- [ ] Screen reader announces ToC and active item
- [ ] Keyboard navigation works (Tab, Enter, Shift+Tab)
- [ ] Color contrast meets WCAG AA (4.5:1 ratio)

**Implementation Steps**:
1. Add ARIA attributes:
   ```tsx
   <nav aria-label="Table of Contents">
     <ol role="list">
       <li>
         <a
           href={`#${item.id}`}
           aria-current={activeHeadingId === item.id ? 'location' : undefined}
         >
           {item.text}
         </a>
       </li>
     </ol>
   </nav>
   ```
2. Add focus styles:
   ```tsx
   <a className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
   ```
3. Test with screen reader (VoiceOver/NVDA):
   - Navigate to ToC → Announces "Table of Contents navigation"
   - Tab through items → Announces heading text
   - Active item → Announces "current location"

**Testing**:
- Accessibility test (axe DevTools): Zero violations
- Manual test (VoiceOver): ToC is navigable and announces correctly
- Manual test (keyboard only): Can navigate and activate ToC items
- Contrast test (WebAIM): All colors meet 4.5:1 ratio

---

### Phase 5: Testing & Documentation

#### 20251012-002-T11: Write Unit Tests
**Complexity**: M
**Description**: Comprehensive unit tests for utilities, hooks, and component
**Dependencies**: T2, T3, T4 (needs all core logic implemented)
**Location**: Test files alongside implementation

**Acceptance Criteria**:
- [ ] `parseToc()` utility: 90%+ coverage
  - Test: Empty HTML → Returns empty array
  - Test: 5 headings → Returns 5 items
  - Test: Nested h3 → Correct children array
  - Test: HTML tags in heading → Stripped
  - Test: Korean text → Preserved correctly
- [ ] `useActiveHeading()` hook: 80%+ coverage
  - Test: Creates observer with correct options
  - Test: Observes all heading elements
  - Test: Cleans up on unmount
- [ ] `TableOfContents` component: 80%+ coverage
  - Test: Renders correct number of items
  - Test: Empty HTML → Returns null
  - Test: Click → Calls scrollIntoView
  - Test: Active item has correct className

**Implementation Steps**:
1. Create test files:
   - `TableOfContents.utils.test.ts`
   - `TableOfContents.hooks.test.ts`
   - `TableOfContents.test.tsx`
2. Use testing libraries:
   - Jest for test runner
   - React Testing Library for component tests
   - jsdom for DOM manipulation (parseToc tests)
3. Write tests following AAA pattern (Arrange, Act, Assert)
4. Run tests: `npm run test`

**Testing**:
- All tests pass
- Coverage report: 85%+ overall

---

#### 20251012-002-T12: Integration & E2E Tests
**Complexity**: L
**Description**: End-to-end tests for full ToC flow in browser
**Dependencies**: T8 (needs integrated feature)
**Location**: `cypress/e2e/table-of-contents.cy.ts` (new file)

**Acceptance Criteria**:
- [ ] Test: Navigate to post → ToC renders with correct items
- [ ] Test: Click ToC item → Page scrolls to section smoothly
- [ ] Test: Scroll page → Active ToC item updates
- [ ] Test: Resize to <1280px → ToC disappears
- [ ] Test: Resize to ≥1280px → ToC appears
- [ ] Test: Post with no headings → ToC does not render
- [ ] Test: Keyboard navigation → ToC items are focusable

**Implementation Steps**:
1. Create Cypress test file
2. Test full flow:
   ```typescript
   describe('Table of Contents', () => {
     beforeEach(() => {
       cy.visit('/posts/sample-post')
     })

     it('renders ToC with correct items', () => {
       cy.get('nav[aria-label="Table of Contents"]').should('exist')
       cy.get('nav[aria-label="Table of Contents"] a').should('have.length.greaterThan', 0)
     })

     it('scrolls to section on click', () => {
       cy.get('nav[aria-label="Table of Contents"] a').first().click()
       cy.url().should('include', '#heading-')
       // Verify scroll position (check if target heading is in viewport)
     })

     it('highlights active section on scroll', () => {
       cy.scrollTo(0, 500)
       cy.wait(200) // Wait for Intersection Observer
       cy.get('nav[aria-label="Table of Contents"] a[aria-current="location"]').should('exist')
     })

     it('hides ToC on mobile', () => {
       cy.viewport(768, 1024)
       cy.get('nav[aria-label="Table of Contents"]').should('not.be.visible')
     })
   })
   ```

**Testing**:
- All Cypress tests pass in Chrome, Firefox, Safari

---

#### 20251012-002-T13: Performance Testing
**Complexity**: S
**Description**: Verify ToC meets performance requirements
**Dependencies**: T8 (needs integrated feature)
**Location**: Manual testing + Chrome DevTools

**Acceptance Criteria**:
- [ ] ToC parsing: <50ms for typical posts (10-20 headings)
- [ ] No janky scrolling (60fps maintained during scroll)
- [ ] `useMemo` prevents re-parsing on every render
- [ ] Intersection observer efficiently tracks 20+ headings
- [ ] Page load time increase <100ms with ToC feature
- [ ] No layout shift (CLS = 0 for ToC area)

**Implementation Steps**:
1. Use Chrome DevTools Performance tab
2. Measure ToC parsing time:
   ```typescript
   console.time('parseToc')
   const toc = parseToc(htmlContent)
   console.timeEnd('parseToc')
   ```
3. Test with long post (30+ headings)
4. Check rendering performance:
   - Record performance profile during scroll
   - Verify 60fps (no dropped frames)
5. Measure layout shift with Lighthouse:
   - Run Lighthouse audit
   - Check CLS score (should be 0)

**Testing**:
- ToC parsing: <50ms ✓
- Scroll performance: 60fps maintained ✓
- Page load impact: <100ms ✓
- CLS score: 0 ✓

---

#### 20251012-002-T14: Documentation & Code Comments
**Complexity**: S
**Description**: Add JSDoc comments and update documentation
**Dependencies**: All implementation tasks complete
**Location**: All component/utility files + README

**Acceptance Criteria**:
- [ ] All public functions have JSDoc comments
- [ ] Complex logic explained with inline comments
- [ ] Component props documented with TypeScript + JSDoc
- [ ] README updated with ToC feature description (optional)
- [ ] No hardcoded magic numbers (use named constants)

**Implementation Steps**:
1. Add JSDoc to public functions:
   ```typescript
   /**
    * Parses HTML content to extract Table of Contents structure
    *
    * @param htmlContent - HTML string containing heading elements
    * @returns Array of ToC items with nested structure
    *
    * @example
    * const toc = parseToc('<h1 id="heading-0">Title</h1>')
    * // Returns: [{ level: 1, text: 'Title', id: 'heading-0' }]
    */
   export function parseToc(htmlContent: string): TocItem[] {
     // Implementation
   }
   ```
2. Document complex logic:
   ```typescript
   // Use root margin to detect headings before they reach the top of viewport
   // This prevents active state from lagging behind scroll position
   const observer = new IntersectionObserver(callback, {
     rootMargin: '-100px 0px -50%' // Top offset 100px, bottom threshold 50%
   })
   ```
3. Extract magic numbers:
   ```typescript
   const DESKTOP_BREAKPOINT = 1280 // Tailwind xl: breakpoint
   const TOC_WIDTH = 250 // pixels
   const MAX_CONTENT_WIDTH = 700 // pixels
   ```

**Testing**:
- All functions have JSDoc comments
- No linting warnings for missing documentation

---

## Task Dependencies & Execution Plan

### Dependency Graph

```
Phase 1: Core Infrastructure
T1 (MarkdownService) ────────────────────┐
                                         │
T2 (parseToc utility) ─────┐             │
                           │             │
T3 (useActiveHeading hook) ┘             │
                                         │
                                         ▼
Phase 2: ToC Component
T2 → T4 (Basic ToC) → T5 (Smooth Scroll) ┐
                                         │
T3 ─────────────────────────────────────┘
                      │
                      ▼
                 T6 (Active Highlighting) → T7 (Styling) → T8 (Layout Integration)
                                                                │
                                                                ▼
Phase 3: Polish
T8 → T9 (Edge Cases) ┐                                          │
T8 → T10 (A11y)      ┘                                          │
                                                                │
                                                                ▼
Phase 4: Testing
T2, T3, T4 → T11 (Unit Tests) ┐                                 │
T8 → T12 (E2E Tests)          ├─────────────────────────────────┘
T8 → T13 (Performance)        │
All → T14 (Documentation)     ┘
```

### Execution Sequence

**Phase 1: Foundation** (Can run T2 and T3 in parallel)
- **Session 1**: T1 (MarkdownService modification)
- **Session 2**: T2 (parseToc utility) + T3 (useActiveHeading hook) **[PARALLEL]**

**Phase 2: Component Development**
- **Session 3**: T4 (Basic ToC component)
- **Session 4**: T5 (Smooth scrolling) + T6 (Active highlighting)
- **Session 5**: T7 (Styling)

**Phase 3: Integration**
- **Session 6**: T8 (Layout integration)

**Phase 4: Edge Cases & Accessibility**
- **Session 7**: T9 (Edge cases) + T10 (Accessibility) **[PARALLEL]**

**Phase 5: Testing & Documentation**
- **Session 8**: T11 (Unit tests)
- **Session 9**: T12 (E2E tests) + T13 (Performance) **[PARALLEL]**
- **Session 10**: T14 (Documentation)

### Parallel Opportunities

**Maximum Parallelization**:
- Session 2: T2 + T3 (independent utilities)
- Session 7: T9 + T10 (different concerns)
- Session 9: T12 + T13 (testing can run simultaneously)

### Critical Path

```
T1 → T2 → T4 → T5 → T6 → T7 → T8 → T12
```

**Longest path**: 8 tasks (sequential)

**Estimated Timeline** (with parallel execution):
- Phase 1: 2 sessions
- Phase 2: 3 sessions
- Phase 3: 1 session
- Phase 4: 1 session
- Phase 5: 3 sessions
- **Total**: ~10 sessions (vs 14 if sequential)

**Estimated Effort**:
- Small tasks (S): 1-2 hours each
- Medium tasks (M): 2-4 hours each
- Large tasks (L): 4-6 hours each
- **Total**: 11-16 hours (matches spec estimate)

---

## Technology Stack

**No New Dependencies Required** ✓

**Existing Dependencies Used**:
- `marked` v16.4.0 - Custom renderer for heading IDs
- `React` v18+ - Component framework, hooks (`useMemo`, `useEffect`, `useState`)
- `Tailwind CSS` v4 - Utility-first styling
- Browser APIs:
  - **Intersection Observer API** - Active section tracking (Chrome 51+, Firefox 55+, Safari 12.1+)
  - **`scrollIntoView()`** - Smooth scrolling (Chrome 61+, Firefox 36+, Safari 15.4+)
  - **`document.createElement()`** - Client-side HTML parsing

**Browser Support**:
- Chrome 90+
- Firefox 88+
- Safari 14+ (smooth scroll has limited support, fallback to instant scroll)
- Edge 90+

---

## Risks & Mitigations

### Risk 1: Heading ID Collisions in Existing Posts
**Probability**: Low
**Impact**: Medium (broken ToC links)

**Mitigation**:
- Position-based IDs avoid collision by design (`heading-0`, `heading-1`, ...)
- Test with existing posts before deployment
- IDs are deterministic (same markdown → same IDs every build)

**Fallback**:
- If collision detected, increment ID: `heading-0-1`

---

### Risk 2: Intersection Observer Browser Support
**Probability**: Low
**Impact**: Medium (no active highlighting on old browsers)

**Mitigation**:
- Target browsers all support Intersection Observer (95%+ coverage)
- Feature detection: Check `'IntersectionObserver' in window`
- Graceful degradation: ToC still navigates, just no active highlighting

**Fallback**:
```typescript
if (!('IntersectionObserver' in window)) {
  console.warn('Intersection Observer not supported, active highlighting disabled')
  return null // Hook returns null, component skips active state logic
}
```

---

### Risk 3: Layout Shift on ToC Render
**Probability**: Medium
**Impact**: High (poor UX, CLS penalty)

**Mitigation**:
- Reserve space for ToC with fixed width (`w-[250px]`)
- Use `shrink-0` to prevent flex shrinking
- Test with Lighthouse CLS metric
- Parse ToC during initial render (not async)

**Fallback**:
- If layout shift detected, add skeleton loader while parsing

---

### Risk 4: Very Long Posts (50+ Headings)
**Probability**: Low
**Impact**: Medium (performance degradation)

**Mitigation**:
- `useMemo` prevents re-parsing on every render
- Intersection Observer efficiently handles 50+ elements
- ToC is scrollable independently (`overflow-y: auto`)
- Test with synthetic long post (100 headings)

**Fallback**:
- If performance issues, add virtualization (e.g., `react-window`)

---

### Risk 5: Korean/Unicode Heading Text Edge Cases
**Probability**: Low
**Impact**: Low (ToC displays incorrectly)

**Mitigation**:
- Position-based IDs avoid slugification issues
- Use `textContent` (not `innerHTML`) to preserve original text
- Test with Korean, Japanese, emoji headings

**Fallback**:
- If encoding issues, normalize Unicode with `.normalize('NFC')`

---

## Success Metrics

### Functional Success Criteria
- [ ] All acceptance criteria from spec met (see AC1-AC7)
- [ ] ToC renders on desktop (≥1280px) for all posts
- [ ] Smooth scrolling works in all target browsers
- [ ] Active section highlighting works correctly
- [ ] No console errors or warnings
- [ ] Passes ESLint and TypeScript checks

### Performance Metrics
- [ ] ToC parsing: <50ms for typical posts (10-20 headings)
- [ ] Intersection observer: <10ms per update (throttled)
- [ ] Page load time: <100ms increase with ToC feature
- [ ] No layout shift (CLS = 0 for ToC area)
- [ ] Smooth scrolling maintains 60fps

### Accessibility Metrics
- [ ] Zero violations in axe DevTools
- [ ] WCAG 2.1 AA compliant (4.5:1 contrast ratio)
- [ ] Keyboard navigation works (Tab, Enter, Shift+Tab)
- [ ] Screen reader announces ToC correctly (VoiceOver/NVDA)
- [ ] All interactive elements have focus visible styles

### Code Quality Metrics
- [ ] 90%+ test coverage for parseToc utility
- [ ] 80%+ test coverage for useActiveHeading hook
- [ ] 80%+ test coverage for TableOfContents component
- [ ] All E2E tests pass in Chrome, Firefox, Safari
- [ ] All public functions have JSDoc comments

---

## Out of Scope

**Explicitly Not Included in This Plan**:
- Mobile ToC implementation (separate feature, see [20251012-001](../ideas/20251012-001-idea-mobile-post-detail-ui-redesign.md))
- Editor page ToC (only post detail page)
- Heading hierarchy validation (user responsibility)
- ToC configuration/settings (always visible on desktop)
- Deep nesting support (h4, h5, h6)
- Collapsible ToC sections
- ToC search/filter functionality
- ToC export feature
- Custom heading IDs in markdown (e.g., `{#custom-id}`)
- Server-side ToC generation (client-side only)

---

## Open Questions & Decisions Needed

### ❓ Q1: Should ToC scroll independently if taller than viewport?
**Proposed**: Yes, use `overflow-y: auto` on ToC container
**Reasoning**: Long posts with 30+ headings would make ToC unusable without scrolling
**Decision**: ✅ **APPROVED** (per spec line 469)

---

### ❓ Q2: Exact scroll offset for fixed headers?
**Proposed**: 20px from top (`sticky top-[20px]`)
**Reasoning**: Provides breathing room at top of viewport
**Decision**: ⏳ **NEEDS UI TESTING** - Adjust after visual review

---

### ❓ Q3: ToC animation on active state change?
**Proposed**: 150ms transition on color/font-weight
**Reasoning**: Smooth visual feedback without jarring jumps
**Decision**: ⏳ **NEEDS DESIGN REVIEW** - Check Figma for animation specs

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Begin Phase 1**: Start with T1 (MarkdownService modification)
3. **Set up tracking**: Create GitHub issues for each task
4. **Schedule sessions**: Allocate ~10 sessions over 1-2 weeks
5. **Prepare test data**: Gather sample posts with various heading structures (Korean, long titles, nested h3)

---

## References

### Design
- **Figma Design**: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/Thirdcommit?node-id=86-1279
- **Related Idea**: [20251012-001 - Mobile Post Detail UI Redesign](../ideas/20251012-001-idea-mobile-post-detail-ui-redesign.md)

### Technical Documentation
- **Marked.js Custom Renderer**: https://marked.js.org/using_pro#renderer
- **Intersection Observer API**: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **CSS-Tricks ToC Guide**: https://css-tricks.com/table-of-contents-with-intersectionobserver/
- **React ToC Implementation**: https://www.emgoto.com/react-table-of-contents/

### Codebase
- [MarkdownService](../../src/domain/blog/services/markdown.service.ts) - Markdown-to-HTML conversion
- [PostDetailPage](../../src/presentation/pages/post-detail/PostDetailPage.tsx) - Post detail page component
- [Post Entity](../../src/domain/blog/entities/post.entity.ts) - Post data model
- [Build Script](../../scripts/build-static-data.mjs) - Static JSON generation

### Knowledge Base
- [PROJECT_OVERVIEW.md](../../docs/kb/PROJECT_OVERVIEW.md) - Project structure and markdown pipeline
- [ARCHITECTURE.md](../../docs/kb/ARCHITECTURE.md) - Hexagonal architecture pattern

---

**Status**: ✅ Completed
**Completed**: 2025-10-12

---

## Implementation Updates

### Update 1: Layout Adjustments (2025-10-12)

**Issue**: Initial implementation had layout issues:
- Post content not centered with TOC
- No equal spacing on left side to balance TOC on right
- Header and body had different widths

**Solution**:
- Added left spacer matching TOC width (250px) to center content
- Updated header layout to match post content width
- Layout structure: `[Spacer 250px] - [Gap] - [Content 700px] - [Gap] - [TOC 250px]`

**Files Modified**:
- [PostDetailPage.tsx:82-107](../../src/presentation/pages/post-detail/PostDetailPage.tsx#L82-L107)

---

### Update 2: TOC Title Integration (2025-10-12)

**Issue**: Post title was not part of TOC structure

**Solution**:
- Extended `TocItem` level type to include `0` for title
- Modified `parseToc()` to accept `postTitle` parameter and add as first item
- Added `id="title"` to h1 element in post content
- Updated component to pass post title to TOC

**Files Modified**:
- [TableOfContents.types.ts:6](../../src/presentation/components/TableOfContents.types.ts#L6)
- [TableOfContents.utils.ts:14-33](../../src/presentation/components/TableOfContents.utils.ts#L14-L33)
- [TableOfContents.tsx:10,44](../../src/presentation/components/TableOfContents.tsx#L10)
- [PostDetailPage.tsx:90,101](../../src/presentation/pages/post-detail/PostDetailPage.tsx#L90)

---

### Update 3: Focus State Styling (2025-10-12)

**Issue**: Weird border appearing when clicking TOC items (focus ring)

**Solution**:
- Removed `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
- Replaced with simple `rounded` class for cleaner appearance
- Maintained focus outline for accessibility

**Files Modified**:
- [TableOfContents.tsx:45](../../src/presentation/components/TableOfContents.tsx#L45)

---

### Update 4: Active Heading Detection Algorithm (2025-10-12)

**Issue**: Multiple problems with highlighting:
1. Highlighting didn't update when clicking TOC item
2. No item highlighted when all headings were below viewport
3. Different behavior when scrolling up vs down
4. Incorrect heading highlighted (not matching visible content)

**Root Cause**: Intersection Observer approach with visibility-based detection was unreliable

**Solution**: Replaced with scroll position-based detection
- Removed Intersection Observer
- Added scroll event listener with `requestAnimationFrame` throttle
- Find last heading that passed viewport reading position (33%)
- Always ensure one heading is highlighted (fallback to first if none passed)
- Consistent behavior regardless of scroll direction

**Eye-Tracking Research Findings** (from NN/g, ResearchGate studies):
- Users spend 80% viewing time above page fold
- 65%+ attention concentrated in top half of viewport
- F-pattern reading shows focus on 30-40% of viewport height
- Changed from 20% to 33% viewport position based on research

**Files Modified**:
- [TableOfContents.hooks.ts:15-68](../../src/presentation/components/TableOfContents.hooks.ts#L15-L68)
- [TableOfContents.tsx:39-50](../../src/presentation/components/TableOfContents.tsx#L39-L50)

**New Algorithm**:
```typescript
// Find last heading that passed the 33% viewport mark
const viewportReadingPosition = window.innerHeight * 0.33
let lastPassedId: string | null = null

for (const id of headingIds) {
  const element = document.getElementById(id)
  if (element) {
    const rect = element.getBoundingClientRect()
    if (rect.top <= viewportReadingPosition) {
      lastPassedId = id
    }
  }
}

// Use last passed heading, or first heading if none passed
const newActiveId = lastPassedId || headingIds[0]
```

**Performance**: Throttled with `requestAnimationFrame` to prevent jank

---

**Status**: ✅ Completed
**Next**: Monitor user feedback on TOC behavior
