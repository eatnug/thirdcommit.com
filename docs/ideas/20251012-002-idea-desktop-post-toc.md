# 20251012-002: Desktop Post Table of Contents (ToC)

**Created**: 2025-10-12
**Status**: IDEA

## User Request

데스크탑 포스트 디테일 화면에서 ToC를 만들고 싶어. 마크다운에서 # 기준으로 테이블을 만들고 싶어. # 는 제목이 쓸거고 본문에서는 ##, ### 까지만 쓸거야. 폼 세이브할떄 파싱해서 데이터를 만드는 로직을 만들어야해.

**Translation**: Want to create a ToC (Table of Contents) for the desktop post detail screen. Create a table based on markdown headings (#). # will be used for the title, and the body will use ## and ### only. Need to create logic to parse and create data when saving the form.

**Figma Design Reference**: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/Thirdcommit?node-id=86-1279

## Current System Overview

### Architecture
- **Clean/Hexagonal Architecture** with clear layer separation:
  - Domain Layer: Business logic and entities
  - Infrastructure Layer: Repository implementations (filesystem, static, API)
  - Presentation Layer: React components and pages

### Post Lifecycle
1. **Creation/Edit**: EditorPage with form state (title, description, content, status)
2. **Save**: Form submission → Use Cases → Repository → Storage (markdown files in `storage/posts/`)
3. **Build**: `build-static-data.mjs` generates static JSON files from markdown
4. **Runtime**: PostDetailPage fetches post data and renders pre-processed HTML

### Markdown Processing Pipeline
```
Raw Markdown (*.md files)
    ↓
gray-matter (frontmatter extraction)
    ↓
marked (Markdown → HTML parsing)
    ↓
shiki (Code syntax highlighting)
    ↓
DOMPurify (XSS sanitization)
    ↓
HTML Output (stored in Post.html field)
    ↓
Rendered via dangerouslySetInnerHTML
```

**Key Services**:
- [MarkdownService](../../src/domain/blog/services/markdown.service.ts) - Core markdown-to-HTML conversion using `marked` + `shiki`
- Build-time processing in [build-static-data.mjs](../../scripts/build-static-data.mjs)

### Current Post Detail Page
- **Layout**: Responsive with mobile (`px-5`) and desktop (`px-[400px]`) padding
- **Rendering**: Uses `dangerouslySetInnerHTML` with Tailwind's `prose` classes
- **Structure**: Header → Title → Metadata (date, reading time) → HTML content
- **No existing ToC component** - This is a new feature

## Related Code

### Core Files
- [PostDetailPage.tsx](../../src/presentation/pages/post-detail/PostDetailPage.tsx) - Main post detail page component
- [markdown.service.ts](../../src/domain/blog/services/markdown.service.ts) - Markdown processing service
- [post.entity.ts](../../src/domain/blog/entities/post.entity.ts) - Post entity definition
- [build-static-data.mjs](../../scripts/build-static-data.mjs) - Static JSON generation

### Editor & Form Logic
- [EditorPage.tsx](../../src/presentation/pages/editor/EditorPage.tsx) - Editor UI with form inputs
- [use-editor-view-model.ts](../../src/presentation/pages/editor/use-editor-view-model.ts) - Form state and save handlers
- [save-post.use-case.ts](../../src/domain/blog/use-cases/save-post.use-case.ts) - Save business logic

### Rendering & Preview
- [PreviewPanel.tsx](../../src/presentation/pages/editor/components/PreviewPanel.tsx) - Editor preview component

## Related Knowledge Base

- [PROJECT_OVERVIEW.md](../../docs/kb/PROJECT_OVERVIEW.md) - Documents markdown parsing with `marked` library, editor workflow, and mentions "Table of contents generation" as a future enhancement (Line 491)
- [ARCHITECTURE.md](../../docs/kb/ARCHITECTURE.md) - Frontend architecture with hexagonal pattern

## Requirements Clarification

### Q1: Where should the ToC data be stored?
**A**: Parse on the client side from rendered HTML (not during form save). Should reflect actual rendered content and be used as anchor for scrolling.

### Q2: Should headings automatically get IDs for anchor linking?
**A**: Yes, headings should have IDs to work as anchors and link to content.

### Q3: ToC Position & Behavior (Desktop)?
**A**:
- Should be **sticky/fixed** on scroll
- Float on the **right side** of the screen (empty space)
- Should break to a different layout when screen can't render content and ToC properly

### Q4: Mobile Behavior?
**A**: No changes for mobile for now. Will implement a whole new mobile UI separately.

### Q5: Active Section Highlighting?
**A**: Yes, would be nice to highlight the current section (intersection observer).

### Q6: Nested Structure?
**A**: Yes, should show visual nesting for `##` and `###`.

### Q7: Title Heading (`#`)?
**A**: Title (`#`) should be the **first item** in the ToC. Clicking on the title (first item) should scroll to the title.

### Q8: Smooth Scrolling?
**A**: Yes, clicking ToC items should smooth scroll to sections.

## Initial Scope

### Phase 1: Core ToC Functionality
- [ ] **Heading ID Generation**: Modify markdown rendering to add IDs to all headings (`h1`, `h2`, `h3`)
  - Implement slugify function for consistent ID generation (e.g., "Getting Started" → "getting-started")
  - Update MarkdownService or renderer configuration to inject IDs

- [ ] **Client-Side ToC Parsing**: Create utility to extract ToC from rendered HTML
  - Parse `h1`, `h2`, `h3` elements from post HTML
  - Build nested structure reflecting heading hierarchy
  - Handle edge cases (duplicate headings, special characters)

- [ ] **ToC Component**: Create `TableOfContents.tsx` component
  - Render nested list with proper indentation
  - Style according to Figma design
  - Handle click events for navigation

### Phase 2: Desktop Layout Integration
- [ ] **PostDetailPage Layout Update**: Integrate ToC into desktop post detail page
  - Adjust content width to accommodate ToC sidebar
  - Position ToC in right sidebar area
  - Implement responsive breakpoint logic

- [ ] **Sticky Positioning**: Make ToC sticky on scroll
  - CSS `position: sticky` or custom scroll handler
  - Handle edge cases (short content, tall ToC)

### Phase 3: Enhanced UX
- [ ] **Smooth Scrolling**: Implement smooth scroll to anchor on click
  - Use `scrollIntoView({ behavior: 'smooth' })`
  - Adjust scroll offset for fixed headers

- [ ] **Active Section Highlighting**: Implement intersection observer
  - Detect which section is currently in viewport
  - Highlight corresponding ToC item
  - Handle edge cases (multiple sections visible)

### Phase 4: Polish
- [ ] **Styling & Animations**: Match Figma design exactly
  - Typography, spacing, colors
  - Hover states, active states
  - Smooth transitions

- [ ] **Accessibility**: Ensure ToC is accessible
  - Semantic HTML (`<nav>`, `<ol>`/`<ul>`)
  - ARIA labels
  - Keyboard navigation support

## Out of Scope

- **Mobile ToC Implementation** - Separate mobile UI redesign (see 20251012-001)
- **Editor Page ToC** - No ToC on editor page, only on post detail page
- **Heading Level Validation** - No enforcement of heading hierarchy in editor
- **ToC Configuration** - No user settings for ToC display (always visible on desktop)
- **Deep Nesting** - Only support `##` and `###` (no `####`, `#####`, `######`)

## Technical Decisions

### Heading ID Generation Strategy
**Decision**: Modify `marked` renderer to auto-generate IDs

**Why**:
- Consistent ID generation across all posts
- No manual ID management in markdown files
- Works with existing markdown content
- IDs can be generated from heading text content

**Implementation Location**: [markdown.service.ts](../../src/domain/blog/services/markdown.service.ts)

### ToC Parsing Strategy
**Decision**: Client-side parsing from rendered HTML (not server-side)

**Why**:
- User's requirement: "should parse it on client since it should reflect actual contents we're rendering"
- Always in sync with rendered content
- No risk of ToC/content mismatch
- Simpler implementation (no build-time parsing needed)

**Trade-off**: Small runtime parsing cost, but negligible for typical post sizes

### Component Architecture
**Decision**: Separate `TableOfContents` component in presentation layer

**Why**:
- Single Responsibility Principle
- Reusable if needed elsewhere
- Easy to test and maintain
- Follows existing component structure

## Dependencies

### Existing Dependencies (No New Installs Required)
- `marked` v16.4.0 - Already used for markdown parsing, has renderer customization
- React hooks (`useMemo`, `useEffect`, `useState`) - For ToC state management
- Intersection Observer API - Native browser API for scroll tracking
- Tailwind CSS v4 - For styling

### Potential New Dependencies (Optional)
- `github-slugger` - More robust slug generation (currently using simple custom implementation)
- `remark-slug` - Alternative if switching to remark/unified ecosystem

**Recommendation**: Start without new dependencies, add only if needed.

## Implementation Considerations

### Heading ID Collision Handling
**Problem**: Multiple headings with same text → duplicate IDs

**Solution**: Append incrementing suffix (e.g., `getting-started`, `getting-started-1`, `getting-started-2`)

### Korean/Unicode Slug Generation
**Problem**: Korean characters in headings need URL-safe slugs

**Solution**:
- Option A: Transliterate Korean to romanization (e.g., "시작하기" → "sijakagi")
- Option B: Use encoded format (e.g., "시작하기" → "시작하기" with proper encoding)
- Option C: Use position-based IDs (e.g., `heading-1`, `heading-2`)

**Decision**: **Option C** - Use position-based IDs for simplicity and reliability.

### Responsive Breakpoint
**Current**: `md:px-[400px]` (768px breakpoint with huge padding)

**New Layout**:
- Main content: Max width with centered layout
- ToC: Fixed right sidebar (e.g., 250px wide)
- Breakpoint: Show ToC when `screen width >= 1280px` (lg) to ensure enough space

### Performance Optimization
- **Memoize ToC parsing**: Use `useMemo` to avoid re-parsing on every render
- **Throttle scroll events**: Limit intersection observer updates
- **Lazy load ToC**: Only render after content is visible

## Data Structure

### TocItem Interface
```typescript
interface TocItem {
  level: 1 | 2 | 3;        // Heading level (h1, h2, h3)
  text: string;            // Heading text content
  id: string;              // Anchor ID (slugified)
  children?: TocItem[];    // Nested headings (for h2 > h3 structure)
}
```

### Example ToC Data
```typescript
[
  {
    level: 1,
    text: "Post Title",
    id: "post-title",
    children: []
  },
  {
    level: 2,
    text: "Introduction",
    id: "introduction",
    children: [
      {
        level: 3,
        text: "Background",
        id: "background"
      }
    ]
  },
  {
    level: 2,
    text: "Getting Started",
    id: "getting-started",
    children: []
  }
]
```

## Next Steps

1. **Create SPEC document** with detailed acceptance criteria and UI mockups
2. **Prototype heading ID injection** in MarkdownService
3. **Build ToC parsing utility** and test with various heading structures
4. **Design ToC component** matching Figma design
5. **Implement intersection observer** for active section tracking
6. **Test with real blog posts** to validate edge cases

## Success Criteria

✅ All headings (h1, h2, h3) have unique IDs for anchor linking
✅ ToC is generated from rendered HTML on the client side
✅ ToC shows nested structure (h2 with h3 children)
✅ ToC is sticky in right sidebar on desktop (≥1280px)
✅ Clicking ToC item smooth scrolls to section
✅ Active section is highlighted in ToC
✅ No layout issues or content overflow
✅ Works with existing posts without modification

## Open Questions

1. **Exact breakpoint width** - What's the minimum screen width to show ToC? (Suggested: 1280px)
2. **ToC max height** - Should ToC scroll independently if it's taller than viewport?
3. **Empty ToC handling** - What to show if post has no headings?
4. **Heading ID conflicts** - How to handle duplicate heading text across posts?

## References

- **Figma Design**: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/Thirdcommit?node-id=86-1279
- **Related Idea**: [20251012-001 - Mobile Post Detail UI Redesign](./20251012-001-idea-mobile-post-detail-ui-redesign.md)
- **MDN: Intersection Observer**: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **Marked Documentation**: https://marked.js.org/using_pro#renderer
