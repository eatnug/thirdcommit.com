# 20251012-002-SPEC: Desktop Post Table of Contents (ToC)

**Created**: 2025-10-12
**Status**: SPEC
**Based on**: [20251012-002-idea-desktop-post-toc.md](../ideas/20251012-002-idea-desktop-post-toc.md)

## Feature Description

Implement a sticky Table of Contents (ToC) sidebar for the desktop post detail page that automatically generates navigation from markdown headings (`h1`, `h2`, `h3`). The ToC will float on the right side of the screen, highlight the currently active section as users scroll, and provide smooth navigation to sections via anchor links.

### Why This Feature?

- **Improved UX**: Readers can quickly scan post structure and jump to relevant sections
- **Better Navigation**: Long-form content becomes more accessible
- **Modern Blog Standard**: Industry-standard feature for technical blogs
- **Professional Appearance**: Matches design system (Figma reference)

## Acceptance Criteria

### Functional Requirements

#### AC1: Heading ID Generation
- [ ] All `h1`, `h2`, `h3` headings in rendered HTML have unique IDs
- [ ] IDs are generated automatically during markdown-to-HTML conversion in [MarkdownService](../../src/domain/blog/services/markdown.service.ts)
- [ ] ID format: `heading-{index}` (e.g., `heading-0`, `heading-1`, `heading-2`)
- [ ] Position-based IDs ensure no collisions regardless of heading text (Korean, Unicode, duplicates)
- [ ] IDs persist across page refreshes (deterministic generation)
- [ ] Existing posts work without modification

#### AC2: Client-Side ToC Parsing
- [ ] ToC data is extracted from rendered HTML on the client side (not during build)
- [ ] Parsing utility extracts all `h1`, `h2`, `h3` elements from post content
- [ ] ToC structure reflects heading hierarchy:
  - `h1`: Title (top-level, first item)
  - `h2`: Main sections (second level)
  - `h3`: Subsections (nested under parent `h2`)
- [ ] Parsing happens once after HTML content is rendered (memoized)
- [ ] Empty headings are skipped gracefully
- [ ] HTML tags inside headings are stripped (plain text only)

#### AC3: ToC Component Rendering
- [ ] `TableOfContents` component renders nested list structure
- [ ] Title (`h1`) appears as first ToC item
- [ ] Visual hierarchy matches Figma design:
  - `h1`: No indentation (0px), distinct visual style (larger/bolder font)
  - `h2`: 0px indentation, standard font weight
  - `h3`: 16px left padding (nested under h2), smaller or lighter font
- [ ] Visual differences between heading levels:
  - `h1`: Font size 16px, font weight 600 (semi-bold)
  - `h2`: Font size 14px, font weight 500 (medium)
  - `h3`: Font size 13px, font weight 400 (regular)
- [ ] Each ToC item shows heading text and links to corresponding anchor
- [ ] Component only renders when post has content (handles empty state)

#### AC4: Desktop Layout Integration
- [ ] ToC visible only on desktop (≥1280px screen width)
- [ ] ToC hidden on mobile and tablet (<1280px)
- [ ] Post content area adjusts to accommodate ToC:
  - **Current**: `px-4 md:px-[400px]` (full-width content)
  - **New**: Max content width ~700px, ToC sidebar ~250px, centered layout
- [ ] No horizontal overflow on edge cases (narrow desktop windows)
- [ ] Layout degrades gracefully below 1280px (ToC disappears, content expands)

#### AC5: Sticky Positioning
- [ ] ToC stays visible as user scrolls (CSS `position: sticky`)
- [ ] ToC positioned in right sidebar area (floating next to content)
- [ ] Top offset accounts for any fixed headers (e.g., 20px from top)
- [ ] ToC does not overlap with content on scroll
- [ ] If ToC height exceeds viewport, ToC is scrollable independently
- [ ] Sticky behavior works in Chrome, Firefox, Safari (modern browsers)

#### AC6: Smooth Scrolling Navigation
- [ ] Clicking ToC item scrolls smoothly to corresponding section
- [ ] Uses native `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- [ ] Scroll offset adjusts for fixed headers (target section appears at top)
- [ ] URL hash updates on click (e.g., `#heading-2`)
- [ ] Browser back/forward buttons work with ToC navigation
- [ ] Keyboard navigation supported (Tab to focus, Enter to activate)

#### AC7: Active Section Highlighting
- [ ] Currently visible section is highlighted in ToC
- [ ] Uses Intersection Observer API to detect active heading
- [ ] Active state styling:
  - **Active item**: Bold text, accent color (e.g., blue)
  - **Inactive items**: Normal weight, default text color
- [ ] Smooth transition between active states (CSS transition)
- [ ] Logic handles edge cases:
  - Multiple sections visible: Highlight topmost
  - No section in view: No highlight
  - Rapid scrolling: Throttled updates (max 1 update per 100ms)
- [ ] Intersection observer has proper root margin (e.g., `-100px 0px -50%`)

### Non-Functional Requirements

#### Performance
- [ ] ToC parsing completes in <50ms for typical posts (~10-20 headings)
- [ ] No janky scrolling or layout shifts when ToC renders
- [ ] `useMemo` prevents re-parsing on every render
- [ ] Intersection observer efficiently tracks max 20 headings simultaneously
- [ ] Page load time increase <100ms with ToC feature

#### Accessibility
- [ ] ToC wrapped in semantic `<nav>` element with `aria-label="Table of Contents"`
- [ ] ToC uses semantic list structure (`<ol>` or `<ul>` with `<li>`)
- [ ] Links have accessible names (heading text)
- [ ] Active item has `aria-current="location"` attribute
- [ ] Keyboard navigation works (Tab, Enter, Shift+Tab)
- [ ] Screen readers announce "Table of Contents navigation" and active item
- [ ] Focus visible styles for keyboard users

#### Browser Compatibility
- [ ] Works in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- [ ] Intersection Observer API supported (polyfill not required for target browsers)
- [ ] CSS `position: sticky` supported
- [ ] Smooth scroll behavior supported (fallback: instant scroll)

#### Maintainability
- [ ] ToC parsing logic is unit-testable (pure function)
- [ ] ToC component is isolated and reusable
- [ ] Follows existing codebase patterns (React hooks, Tailwind CSS)
- [ ] Code documented with JSDoc comments for complex logic
- [ ] No hardcoded magic numbers (e.g., breakpoints defined as constants)

## Technical Requirements

### Architecture

**Layer Separation** (following existing hexagonal architecture):
- **Domain Layer**: No changes (business logic unchanged)
- **Infrastructure Layer**: No changes (markdown processing happens in MarkdownService)
- **Presentation Layer**: New ToC component + utilities

**Data Flow**:
```
Markdown File (.md)
    ↓
MarkdownService.toHtml() [MODIFIED]
    ├─ marked.parse() with custom renderer
    ├─ Inject heading IDs (heading-0, heading-1, ...)
    ├─ shiki syntax highlighting
    ├─ DOMPurify sanitization
    ↓
Post.html (HTML string with IDs)
    ↓
PostDetailPage renders HTML (dangerouslySetInnerHTML)
    ↓
[CLIENT-SIDE] TableOfContents component
    ├─ Parse HTML → Extract headings (parseToc utility)
    ├─ Build nested TocItem[] structure
    ├─ Render ToC list with links
    ├─ Intersection Observer tracks active section
    ↓
User clicks ToC item → Smooth scroll to section
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
[
  {
    level: 1,
    text: "How to Build a Blog with React",
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
        id: "heading-2"
      },
      {
        level: 3,
        text: "Prerequisites",
        id: "heading-3"
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

### API Contracts

**No new API endpoints** (client-side only feature)

### Component Architecture

#### New Components

**1. TableOfContents Component**
- **Location**: `src/presentation/components/TableOfContents.tsx`
- **Props**:
  ```typescript
  interface TableOfContentsProps {
    /** HTML content to parse for headings */
    htmlContent: string;
  }
  ```
- **Responsibilities**:
  - Parse HTML to extract ToC data (via `useMemo`)
  - Render nested ToC list
  - Handle click events (smooth scroll)
  - Track active section (Intersection Observer)
  - Apply active/inactive styles

**2. Utility Functions**

**`parseToc(htmlContent: string): TocItem[]`**
- **Location**: `src/presentation/components/TableOfContents.utils.ts`
- **Input**: HTML string
- **Output**: Flat or nested `TocItem[]` array
- **Logic**:
  1. Create temporary DOM element from HTML string
  2. Query all `h1`, `h2`, `h3` elements
  3. Extract `id`, `textContent`, and `tagName` (level)
  4. Build nested structure (h3 under parent h2)
  5. Return structured array

**`useActiveHeading(headingIds: string[]): string | null`**
- **Location**: `src/presentation/components/TableOfContents.hooks.ts`
- **Input**: Array of heading IDs to observe
- **Output**: Currently active heading ID (or null)
- **Logic**:
  1. Create Intersection Observer with root margin `-100px 0px -50%`
  2. Observe all heading elements
  3. Track which headings are in viewport
  4. Return topmost visible heading ID
  5. Cleanup observer on unmount

### Modified Files

#### MarkdownService (`src/domain/blog/services/markdown.service.ts`)

**Changes**:
- Add custom heading renderer to inject IDs
- Use position-based ID generation (`heading-{index}`)

**Implementation**:
```typescript
export class MarkdownService {
  async toHtml(markdown: string): Promise<string> {
    const highlighter = await getHighlighter()
    const renderer = new marked.Renderer()

    // Track heading index for unique IDs
    let headingIndex = 0

    // Custom heading renderer
    renderer.heading = ({ tokens, depth }) => {
      const text = this.parser.parseInline(tokens)
      const id = `heading-${headingIndex++}`
      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    }

    renderer.code = ({ text, lang }) => {
      // ... existing code highlighting logic
    }

    marked.use({ renderer })
    const html = await marked.parse(markdown)
    return DOMPurify.sanitize(html)
  }
}
```

#### PostDetailPage (`src/presentation/pages/post-detail/PostDetailPage.tsx`)

**Changes**:
- Import `TableOfContents` component
- Adjust layout to accommodate ToC sidebar
- Pass post HTML to ToC component

**New Layout Structure**:
```tsx
<div className="flex flex-col">
  {/* Header (existing) */}

  {/* Content + ToC Container (NEW) */}
  <div className="flex justify-center gap-8 px-5 py-5">
    {/* Main Content */}
    <article className="prose prose-lg max-w-[700px]">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: displayContent }} />
    </article>

    {/* ToC Sidebar (Desktop Only) */}
    <aside className="hidden xl:block w-[250px]">
      <TableOfContents htmlContent={displayContent} />
    </aside>
  </div>
</div>
```

### Technology Stack

**Existing Dependencies** (no new installs):
- `marked` v16.4.0 - Markdown parser with custom renderer support
- `React` v18+ - Component framework
- `Tailwind CSS` v4 - Styling
- Browser APIs:
  - Intersection Observer API (active section tracking)
  - `scrollIntoView()` (smooth scrolling)

**No New Dependencies Required**

### Styling Guidelines

**ToC Container**:
- Width: `250px`
- Position: `sticky`, `top-[20px]`
- Max height: `calc(100vh - 40px)`
- Overflow: `auto` (scrollable if tall)
- Background: Transparent
- Padding: `16px`

**ToC List**:
- No bullets (`list-style: none`)
- Spacing between items: `8px`
- Line height: `1.5`

**ToC Items by Level**:
- **h1 items**:
  - Font size: `16px` (text-base)
  - Font weight: `600` (font-semibold)
  - No indentation
  - Color: `text-gray-700` (default), `text-gray-900` (hover), `text-blue-600` (active)
- **h2 items**:
  - Font size: `14px` (text-sm)
  - Font weight: `500` (font-medium)
  - No indentation
  - Color: `text-gray-600` (default), `text-gray-900` (hover), `text-blue-600` (active)
- **h3 items**:
  - Font size: `13px` (text-xs)
  - Font weight: `400` (font-normal)
  - Indentation: `padding-left: 16px`
  - Color: `text-gray-500` (default), `text-gray-700` (hover), `text-blue-600` (active)

**ToC Item States** (all levels):
- Default state: Gray color (varies by level)
- Hover state: Darker gray, `underline`
- Active state: `text-blue-600`, bold font weight
- Transition: `all 150ms ease-in-out`

**Responsive Breakpoint**:
- ToC visible: `≥1280px` (Tailwind `xl:`)
- ToC hidden: `<1280px`

## Best Practices Applied

### From Web Research

**1. Position-Based Heading IDs**
- **Why**: Avoids collision issues with Korean/Unicode text or duplicate headings
- **Trade-off**: IDs are not human-readable, but more reliable
- **Source**: CommonMark discussion, marked.js issues

**2. Client-Side ToC Parsing**
- **Why**: Always in sync with rendered content, simpler implementation
- **Trade-off**: Small runtime cost, but negligible for typical posts
- **Source**: User requirement + web research on dynamic ToC generation

**3. Intersection Observer for Active Tracking**
- **Why**: Performant scroll tracking, no manual scroll event listeners
- **Root margin**: `-100px 0px -50%` prevents false positives
- **Source**: CSS-Tricks articles, MDN documentation

**4. Sticky Positioning Over Fixed**
- **Why**: Simpler CSS, no JavaScript scroll calculations
- **Works**: Modern browser support is excellent (95%+)
- **Source**: CSS-Tricks, web development best practices

**5. Semantic HTML for Accessibility**
- **Why**: Screen reader support, keyboard navigation
- **Structure**: `<nav aria-label="...">` + `<ol>/<ul>` + `<a>` links
- **Source**: W3C WAI-ARIA best practices

### From Codebase Patterns

**1. Hexagonal Architecture Separation**
- ToC is presentation-layer concern (no domain/infra changes)
- Follows existing component structure in `src/presentation/`

**2. React Hooks for State Management**
- `useMemo` for ToC parsing (memoization)
- `useEffect` for Intersection Observer lifecycle
- `useState` for active heading tracking

**3. Tailwind CSS for Styling**
- Use utility classes, no custom CSS files
- Responsive classes (`xl:block`, `xl:hidden`)

**4. Component Isolation**
- `TableOfContents` is self-contained and testable
- No tight coupling with PostDetailPage

## Edge Cases & Constraints

### Edge Cases

#### 1. No Headings in Post
- **Scenario**: Post has no `h1`, `h2`, `h3` elements
- **Solution**: ToC component returns `null` (empty state, no render)
- **Validation**: Check `tocItems.length === 0` before rendering

#### 2. Only Title (h1), No Body Headings
- **Scenario**: Post has single `h1` (title) but no `h2`/`h3`
- **Solution**: ToC shows title only (still useful for scroll-to-top)
- **UI**: Single ToC item, no nested structure

#### 3. Duplicate Heading Text
- **Scenario**: Multiple headings with same text (e.g., "Introduction")
- **Solution**: Position-based IDs ensure uniqueness (`heading-1`, `heading-2`)
- **No collision**: Each heading gets unique ID regardless of text

#### 4. Korean/Unicode Headings
- **Scenario**: Headings contain Korean characters (e.g., "시작하기")
- **Solution**: Position-based IDs bypass slugification issues
- **ToC display**: Shows original Korean text (no transliteration needed)

#### 5. HTML Tags Inside Headings
- **Scenario**: Heading contains `<code>`, `<em>`, or other inline tags
- **Solution**: Strip HTML tags when building ToC (use `textContent` not `innerHTML`)
- **Example**: `<h2>Using <code>React</code></h2>` → ToC shows "Using React"

#### 6. Very Long Headings
- **Scenario**: Heading text exceeds ToC width (250px)
- **Solution**: CSS `overflow-wrap: break-word`, multi-line display
- **Max lines**: No truncation (full text visible)

#### 7. Deep Nesting (h4, h5, h6)
- **Scenario**: Post uses `h4`, `h5`, `h6` (out of scope)
- **Solution**: Ignore deeper headings (only parse `h1`, `h2`, `h3`)
- **Validation**: User requirement specifies `##` and `###` only

#### 8. Many Headings (20+)
- **Scenario**: Long post with 30+ headings
- **Solution**: ToC scrollable independently (`overflow-y: auto`)
- **Performance**: Intersection Observer handles 20+ elements efficiently

#### 9. Narrow Desktop (1280px - 1400px)
- **Scenario**: Desktop at minimum ToC breakpoint (tight layout)
- **Solution**: Reduce content width to fit (ensure 700px content + 250px ToC + gaps)
- **Fallback**: If width insufficient, ToC hidden via media query

#### 10. Draft Posts with Placeholder Content
- **Scenario**: Post status is `draft`, shows "✍️ing..." placeholder
- **Solution**: ToC parses placeholder HTML (likely no headings → empty state)
- **No error**: Component handles empty result gracefully

### Failure Scenarios

#### ToC Parsing Error
- **Cause**: Malformed HTML, unexpected structure
- **Mitigation**: Wrap parsing in try-catch, return empty array on error
- **User impact**: ToC doesn't show, content still readable (graceful degradation)
- **Logging**: Console error for debugging

#### Intersection Observer Unsupported
- **Cause**: Old browser without Intersection Observer API
- **Mitigation**: Feature detection, fallback to no active highlighting
- **User impact**: ToC still navigates, but no active state
- **Target browsers**: Modern browsers (Chrome 90+) all support IO

#### Smooth Scroll Unsupported
- **Cause**: Safari older versions, some browsers
- **Mitigation**: Detect `scrollBehavior` support, fallback to instant scroll
- **User impact**: Clicking ToC jumps instead of smooth scroll (minor UX degradation)

#### Anchor Not Found
- **Cause**: Heading ID in ToC doesn't match actual heading (rare)
- **Mitigation**: Validate ID exists before scrolling, log warning
- **User impact**: Click does nothing (no scroll)

#### Layout Shift on ToC Render
- **Cause**: ToC renders after content, causing reflow
- **Mitigation**: Reserve space for ToC on initial render (skeleton or fixed width)
- **User impact**: Smooth visual experience, no content jump

### Data Consistency

**Deterministic ID Generation**:
- Heading IDs generated in order (top to bottom)
- Same markdown input → same IDs every time
- No randomness or timestamps in ID generation

**Client-Server Consistency**:
- ToC always reflects current rendered HTML
- No stale data (parsed on every page load)

**Race Conditions**:
- None (no async state updates between ToC parsing and rendering)

## Success Metrics

### User Experience
- [ ] 80%+ of desktop users scroll past initial viewport (engagement indicator)
- [ ] Average time on page increases by 15% (better navigation)
- [ ] Bounce rate decreases by 10% (improved content discoverability)

### Technical Performance
- [ ] ToC parsing: <50ms for typical posts (10-20 headings)
- [ ] Intersection observer: <10ms per update (throttled)
- [ ] Page load time: <100ms increase with ToC feature
- [ ] No layout shift (CLS = 0 for ToC area)

### Code Quality
- [ ] 90%+ test coverage for ToC parsing utility
- [ ] Zero accessibility violations (axe DevTools)
- [ ] No console errors or warnings
- [ ] Passes ESLint/TypeScript checks

## Out of Scope

### Explicitly Not Included

- **Mobile ToC Implementation**: Separate mobile UI redesign (see [20251012-001](./20251012-001-idea-mobile-post-detail-ui-redesign.md))
- **Editor Page ToC**: No ToC on editor page, only on post detail page
- **Heading Level Validation**: No enforcement of heading hierarchy in markdown (user responsibility)
- **ToC Configuration**: No user settings for ToC display (always visible on desktop ≥1280px)
- **Deep Nesting**: Only support `h1`, `h2`, `h3` (no `h4`, `h5`, `h6`)
- **Collapsible ToC Sections**: No expand/collapse functionality (all items always visible)
- **ToC Search/Filter**: No search box to filter ToC items
- **ToC Export**: No "export ToC" or "copy ToC" functionality
- **Custom Heading IDs**: No manual ID specification in markdown (e.g., `{#custom-id}`)
- **ToC in Other Pages**: Only post detail page (not homepage, project page, etc.)
- **Server-Side ToC Generation**: ToC is client-side only (not pre-rendered in static JSON)

## Open Questions

### Resolved Questions

✅ **Q1**: Where should ToC data be stored?
- **A**: Client-side parsing from rendered HTML (not build-time)

✅ **Q2**: Should headings automatically get IDs?
- **A**: Yes, position-based IDs (`heading-{index}`)

✅ **Q3**: ToC position & behavior (desktop)?
- **A**: Sticky, right sidebar, ≥1280px breakpoint

✅ **Q4**: Mobile behavior?
- **A**: Hidden on mobile (out of scope)

✅ **Q5**: Active section highlighting?
- **A**: Yes, Intersection Observer

✅ **Q6**: Nested structure?
- **A**: Yes, h3 nested under h2

✅ **Q7**: Title heading (h1)?
- **A**: First item in ToC, clickable (scroll to top)

✅ **Q8**: Smooth scrolling?
- **A**: Yes, `scrollIntoView({ behavior: 'smooth' })`

### Remaining Questions

❓ **Q9**: Should ToC scroll independently if taller than viewport?
- **Proposed**: Yes, `overflow-y: auto` on ToC container
- **Decision needed**: User confirmation

❓ **Q10**: Exact scroll offset for fixed headers?
- **Current**: 20px from top (`sticky top-[20px]`)
- **Decision needed**: Test in UI, adjust if needed

❓ **Q11**: ToC animation on active state change?
- **Proposed**: 150ms transition on color/font-weight
- **Decision needed**: Review Figma design for animation specs

## Next Steps

### Phase 1: Core Implementation (Estimated: 4-6 hours)
1. [ ] Modify [MarkdownService](../../src/domain/blog/services/markdown.service.ts) to inject heading IDs
2. [ ] Create `parseToc` utility function with unit tests
3. [ ] Build `TableOfContents` component (basic rendering)
4. [ ] Integrate ToC into [PostDetailPage](../../src/presentation/pages/post-detail/PostDetailPage.tsx) layout
5. [ ] Test with existing posts (verify IDs, no regressions)

### Phase 2: Enhanced UX (Estimated: 3-4 hours)
6. [ ] Implement `useActiveHeading` hook with Intersection Observer
7. [ ] Add smooth scroll functionality on ToC click
8. [ ] Style ToC per Figma design (colors, spacing, hover states)
9. [ ] Test responsive behavior (≥1280px show, <1280px hide)

### Phase 3: Polish & Accessibility (Estimated: 2-3 hours)
10. [ ] Add ARIA labels and semantic HTML
11. [ ] Test keyboard navigation (Tab, Enter)
12. [ ] Test with screen reader (VoiceOver/NVDA)
13. [ ] Add error handling (parse errors, missing IDs)
14. [ ] Performance testing (large posts, many headings)

### Phase 4: Testing & Documentation (Estimated: 2-3 hours)
15. [ ] Write unit tests for `parseToc` utility (90%+ coverage)
16. [ ] Manual testing in Chrome, Firefox, Safari, Edge
17. [ ] Test edge cases (no headings, Korean text, long titles)
18. [ ] Document component usage (JSDoc comments)
19. [ ] Create PLAN document with detailed task breakdown

**Total Estimated Effort**: 11-16 hours (1-2 days)

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

**Status**: Ready for implementation
**Next**: Create [PLAN document](../plans/20251012-002-plan-desktop-post-toc.md) with detailed task breakdown
