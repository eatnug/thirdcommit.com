# 20251012-001: Mobile Post Detail UI Redesign

**Created**: 2025-10-12
**Status**: IDEA

## User Request

모바일 포스트 상세 페이지 UI를 변경하고 싶습니다.

**기존 UI**: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/Thirdcommit?node-id=9-861
**새 UI**: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/Thirdcommit?node-id=78-1236

## Current System Overview

### Current Implementation

포스트 상세 페이지는 블로그 포스트를 표시하는 읽기 전용 페이지입니다.

**Main Component**: [`src/presentation/pages/post-detail/PostDetailPage.tsx`](src/presentation/pages/post-detail/PostDetailPage.tsx)

**Current Mobile Layout** (기존 디자인 - Figma 9:861):
- **Header**: 160px height
  - Profile section with name, socials, bio (30px top padding)
  - Bio text displayed below name
  - Menu tabs below profile (110px from top)

**Current Responsive Structure**:
```tsx
<div className="px-4 md:px-[400px] py-[20px]">
  <Header /> {/* Shared component */}
  <article className="prose prose-lg max-w-none">
    <div className="flex flex-col gap-[20px]">
      <h1>{post.title}</h1>
      <div className="text-sm text-gray-500 not-prose">
        {post.created_at} · {post.readingTime}
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </div>
  </article>
</div>
```

**Current Header Component**: [`src/presentation/layouts/Header.tsx`](src/presentation/layouts/Header.tsx)
- Shared across all pages (Blog, About, Write, Post Detail)
- Mobile: `flex-col` layout (stacked vertically)
  - Name + Socials + Bio in first section
  - Menu tabs in second section
- Desktop: `flex-row` layout (horizontal)

### Data Flow

```
Route (/posts/:slug)
  → PostDetailPage.tsx
  → React Query (5min cache)
  → blogApi.getPost(slug)
  → Use Case Layer
  → Repository (Static JSON/API)
```

**Post Entity**:
- `id`, `slug`, `title`, `status`, `created_at`, `updated_at`, `published_at`
- `description`, `content` (markdown), `html` (rendered), `readingTime`

### Current Mobile Styling
- Container: `px-4` (16px horizontal padding)
- Vertical spacing: `py-[20px]`
- Typography: `prose prose-lg max-w-none` (Tailwind Typography plugin)
- Metadata: `text-sm text-gray-500`
- Breakpoint: 768px (`md:`)

## Proposed Changes

### New Mobile UI (Figma 78:1236)

**Key Differences**:

1. **Compact Header** (160px → 80px):
   - **Remove**: Bio text below name
   - **New Layout**: Single row with name/socials on left, menu tabs on right
   - Profile section: 20px top padding (was 30px)
   - Menu aligned to same row as name (not below)

2. **Header Structure Change**:
   ```
   OLD (160px):
   ┌─────────────────────────────┐
   │ Jake Park [icons]   (30px)  │
   │ Bio text here...            │
   │                    (110px)  │
   │              Blog | About   │
   └─────────────────────────────┘

   NEW (80px):
   ┌─────────────────────────────┐
   │ Jake Park [icons]  Blog|About│ (20px top)
   └─────────────────────────────┘
   ```

3. **Content Layout**:
   - Maintains 20px horizontal padding
   - Title, date, content structure remains similar
   - Spacing and typography may need adjustment per Figma specs

4. **Alignment Changes**:
   - Header now uses horizontal layout on mobile
   - Name/socials: left-aligned
   - Menu: right-aligned
   - Both in same row with space-between

## Related Code

### Primary Files to Modify

1. **`src/presentation/pages/post-detail/PostDetailPage.tsx:13-51`**
   - Main post detail page component
   - Currently uses shared `<Header />` component
   - **Action**: Replace with mobile-specific compact header for this page only

2. **`src/presentation/layouts/Header.tsx:1-63`**
   - Shared header component used across all pages
   - **Action**: Do NOT modify (other pages still use this)
   - **Instead**: Create new component or inline header for mobile post detail

3. **`src/presentation/globals.css`**
   - Global CSS and Tailwind configuration
   - May need custom styles if Tailwind utilities insufficient

### Supporting Files

4. **`src/presentation/pages/post-detail/PostDetailPage.tsx`** (full file)
   - React Query data fetching
   - Document title management
   - Error handling (redirect to home)
   - Draft post placeholder logic

5. **`src/presentation/App.tsx:31`**
   - Route configuration: `/posts/:slug` → `PostDetailPage`

6. **`src/domain/blog/entities/post.entity.ts`**
   - Post entity structure (read-only, no changes needed)

## Related Knowledge Base

### Architecture Patterns

- **`docs/kb/ARCHITECTURE.md`** - Three-tier volatility-based architecture
  - This is a UI-only change (TIER 1 - Volatile layer)
  - Domain and Infrastructure layers unaffected

### Past UI Work

- **`docs/ideas/20251007-001-idea-unified-tabbed-interface.md`**
  - Previous major UI redesign from multi-page to tabbed interface
  - Figma designs for mobile and web layouts
  - Responsive design patterns: mobile (<768px), tablet (768px-1024px), desktop (>1024px)
  - Tailwind CSS migration patterns

- **`docs/specs/20251007-001-spec-unified-tabbed-interface.md`**
  - URL structure changes
  - Accessibility requirements (ARIA, keyboard nav, screen readers)
  - Static export compatibility

- **`docs/MIGRATION_COMPLETE.md`**
  - Vite + React Router 7 migration
  - Static data build process
  - Client-side rendering patterns

### Styling Patterns

From past work:
- Utility-first Tailwind CSS (no custom CSS files)
- Responsive breakpoints: `md:` at 768px
- Component patterns: Card primitives, reusable buttons
- Design tokens: `bg-card`, `text-foreground`, etc.
- Accessibility: 4.5:1 contrast ratio, visible focus indicators

## Requirements Clarification

### Q1: 새 디자인 확인
**Q**: Figma에서 두 개의 모바일 디자인 발견 (9:861 vs 78:1236). 어느 것이 새 디자인?
**A**: 78:1236이 새 디자인

### Q2: Header 변경 범위
**Q**: 헤더 변경이 모든 페이지에 영향을 주나요?
**A**: 아니요, 모바일 포스트 상세 페이지에서만 새 헤더 사용

### Q3: Bio 제거 의도
**Q**: Bio 텍스트 제거가 의도한 변경사항?
**A**: 네, 맞습니다

### Q4: 구조적 변경
**Q**: 레이아웃만 조정하면 되나요, 아니면 구조적 변경도 필요?
**A**: 구조적 변경 필요. Bio 제거되었고, 이름과 메뉴가 같은 row에 있어서 정렬 변경됨

### Q5: 작업 범위
**Q**: 변경 범위는?
**A**:
- ✅ 모바일 포스트 상세 페이지만 변경
- ✅ 타이포그래피 및 스타일링 조정
- ❌ 데스크톱 디자인 변경 없음
- ❌ 다른 모바일 페이지 영향 없음

### Q6: Draft Post 표시
**Q**: Draft 포스트의 placeholder ("✍️ing...") 동작 유지?
**A**: 네, 건들지 말 것

### Q7: Responsive Breakpoint
**Q**: 768px (`md:`) breakpoint 유지?
**A**: 네, 건들지 말 것

## Initial Scope

### In Scope

1. **Mobile Post Detail Header Redesign**
   - Create compact header component/layout (80px height)
   - Remove bio text from mobile header
   - Horizontal layout: name/socials (left) + menu tabs (right)
   - Adjust padding: 20px top (was 30px), 20px horizontal

2. **Component Strategy**
   - Option A: Create new `<MobilePostHeader />` component
   - Option B: Inline header JSX in `PostDetailPage.tsx` for mobile only
   - Use conditional rendering: mobile gets new header, desktop keeps shared `<Header />`

3. **Layout Adjustments**
   - Header: `flex-row` with `justify-between` on mobile
   - Profile section (name + socials): left-aligned
   - Menu section: right-aligned
   - Verify spacing matches Figma (20px padding, proper gaps)

4. **Typography & Styling**
   - Review and adjust font sizes, weights, colors per Figma
   - Ensure proper contrast ratios (accessibility)
   - Post title, date, content spacing adjustments if needed

5. **Responsive Behavior**
   - Mobile (<768px): New compact header
   - Desktop (≥768px): Keep existing shared header
   - Ensure smooth transition at breakpoint

6. **Testing Considerations**
   - Visual regression on mobile devices
   - Header alignment and spacing
   - Menu tab functionality preserved
   - Social links still clickable
   - Post content rendering unchanged

### Out of Scope

1. ❌ Desktop/tablet post detail page changes
2. ❌ Other mobile pages (Blog list, About, Editor)
3. ❌ Shared `Header.tsx` component modifications
4. ❌ Draft post placeholder logic changes
5. ❌ Responsive breakpoint changes (keep 768px)
6. ❌ Data fetching or business logic changes
7. ❌ Navigation/routing changes
8. ❌ Analytics tracking changes
9. ❌ Accessibility features beyond visual compliance

## Design Specifications (from Figma 78:1236)

### Mobile Post Detail Header (node 78:1236)

**Dimensions**:
- Container: 402px width × 80px height
- Horizontal padding: 20px (left/right)
- Top padding: 20px (from container top to name baseline)

**Layout Structure**:
```
Frame "Header" (0, 0, 402, 80)
  ├─ Frame "Title" (20, 24.5, 186, 31)
  │   ├─ Text "Name" (0, 0, 110, 31) - "Jake Park"
  │   └─ Frame "Socials" (120, 5.5, 66, 20)
  │       ├─ linkedin_alt logo (0, 0, 20, 20)
  │       ├─ github logo (23, 0, 20, 20)
  │       └─ maildotru logo (46, 0, 20, 20)
  └─ Frame "Menu" (262, 20, 120, 40)
      └─ Frame "Menu Item List" (0, 0, 120, 40)
          ├─ "Menu Item Focused" - "Blog" (0, 0, 48, 40)
          └─ "Menu Item" - "About" (58, 0, 62, 40)
```

**Key Measurements**:
- Name section: starts at x=20, y=24.5
- Menu section: starts at x=262 (right side), y=20
- Social icons spacing: 23px between icons
- Menu items: "Blog" (48px width), "About" (62px width), 10px gap

**Post Content** (node 78:1258):
```
Frame "Post" (0, 80, 402, 764)
  └─ Frame "Post" (20, 0, 362, 768)
      ├─ Frame "Title" (0, 20, 362, 30)
      ├─ Frame "Date" (0, 60, 103, 18)
      └─ Frame "Content" (0, 88, 362, 660)
```

- Post container starts at y=80 (right after header)
- Inner padding: 20px horizontal
- Title: 20px top margin, 30px height
- Date: 60px from top, 18px height
- Content: starts at 88px from top

## Technical Implementation Notes

### Approach Options

**Option 1: Conditional Header Component**
```tsx
// In PostDetailPage.tsx
const isMobile = window.innerWidth < 768; // Or use useMediaQuery hook

return (
  <div className="px-4 md:px-[400px] py-[20px]">
    {isMobile ? <MobilePostHeader /> : <Header />}
    {/* Post content */}
  </div>
);
```

**Option 2: CSS-Based Responsive Design**
```tsx
// Single header with different mobile/desktop styles
<div className="header-container">
  <div className="mobile-only compact-header">...</div>
  <div className="desktop-only">
    <Header />
  </div>
</div>
```

**Option 3: Inline Mobile Header (Simplest)**
```tsx
// In PostDetailPage.tsx
<div className="flex md:hidden px-5 py-5 items-center justify-between h-[80px]">
  {/* Mobile header JSX */}
</div>
<div className="hidden md:flex">
  <Header />
</div>
```

**Recommendation**: Option 3 (inline) for simplicity, or Option 1 if header becomes complex.

### Tailwind Classes to Consider

```tsx
// Container
className="h-[80px] px-5 pt-5 flex items-center justify-between"

// Left section (name + socials)
className="flex items-start gap-[30px]"  // or gap-3

// Name
className="text-[24px] font-bold"  // Adjust per Figma

// Socials
className="flex gap-[23px] items-center"

// Right section (menu)
className="flex gap-[10px]"

// Menu item focused
className="px-[5px] py-2 text-[16px] font-medium border-b-2 border-black"

// Menu item
className="px-[5px] py-2 text-[16px] text-gray-600"
```

### Accessibility Considerations

- Maintain ARIA labels on social links
- Menu tab focus states must be visible
- Keyboard navigation preserved
- Screen reader compatibility
- Contrast ratios verified (4.5:1 minimum)

## Next Steps

- [ ] Create SPEC document with detailed acceptance criteria
- [ ] Extract exact design tokens from Figma (colors, fonts, spacing)
- [ ] Decide on implementation approach (conditional component vs inline)
- [ ] Create mobile-specific header component or layout
- [ ] Update PostDetailPage.tsx with responsive header logic
- [ ] Verify typography matches Figma specifications
- [ ] Test on various mobile devices and screen sizes
- [ ] Visual QA against Figma design
- [ ] Accessibility audit
