# 20251012-001: Mobile Post Detail UI Redesign

**Created**: 2025-10-12
**Status**: SPEC
**Based on**: `docs/ideas/20251012-001-idea-mobile-post-detail-ui-redesign.md`

## Feature Description

Redesign the mobile post detail page header from a 160px vertical layout to an 80px compact horizontal layout. The current header displays name, bio text, and social links in a stacked format with menu tabs below. The new design removes the bio text and arranges name/socials on the left with menu tabs on the right in a single row, optimizing valuable mobile screen space while maintaining all essential navigation and branding elements.

This change affects **only** the mobile post detail page (< 768px) and does not impact desktop views or other pages.

## Acceptance Criteria

### Functional Requirements

**AC1: Mobile Header Layout Transformation**
- [ ] Header height reduced from 160px to 80px on mobile devices (< 768px)
- [ ] Bio text removed from mobile header (still present on desktop)
- [ ] Name and social icons displayed on left side of header
- [ ] Menu tabs (Blog/About) displayed on right side of header
- [ ] Both sections aligned horizontally in single row with space-between

**AC2: Responsive Header Rendering**
- [ ] Mobile (< 768px): Shows new compact horizontal header
- [ ] Desktop (≥ 768px): Shows existing shared `<Header />` component
- [ ] Breakpoint transition occurs smoothly at 768px
- [ ] No layout shift or flash of unstyled content during responsive switch

**AC3: Mobile Header Spacing & Dimensions**
- [ ] Container height: exactly 80px
- [ ] Horizontal padding: 20px (left and right)
- [ ] Top padding: 20px from container top to name baseline
- [ ] Name section positioned at x=20 (left edge with padding)
- [ ] Menu section positioned at right edge with padding

**AC4: Name & Social Links Section**
- [ ] Name displays "Jake Park" in Gothic A1 font, 25px size
- [ ] Social icons positioned inline with name (horizontal alignment)
- [ ] Social icons order: LinkedIn, GitHub, Email
- [ ] Social icon size: 20x20px each
- [ ] Gap between social icons: 23px
- [ ] Gap between name and social icons: 10px
- [ ] All social links remain clickable with proper tap target size (min 44x44px)

**AC5: Menu Navigation Section**
- [ ] Menu items display "Blog" and "About" text
- [ ] Active menu item has bottom border (3px, black)
- [ ] Inactive menu items have transparent border with hover effect (gray-300)
- [ ] Font size: 20px for menu items
- [ ] Gap between menu items: 10px
- [ ] Active state correctly reflects current page (Blog active on post detail)

**AC6: Post Content Layout**
- [ ] Post content starts immediately after 80px header
- [ ] Title, date, and reading time display unchanged
- [ ] Content horizontal padding: 20px (consistent with header)
- [ ] Typography and spacing match existing design
- [ ] Draft posts still show "✍️ing..." placeholder

**AC7: Preserved Functionality**
- [ ] Navigation between Blog/About tabs works correctly
- [ ] Social links open in new tabs with proper rel attributes
- [ ] Document title updates with post title
- [ ] Loading state displays correctly with new header
- [ ] Error handling redirects to home page as before
- [ ] React Query caching behavior unchanged (5min cache)

### Non-Functional Requirements

**Accessibility**:
- [ ] All interactive elements meet minimum tap target size (44x44px for iOS, 48x48px for Android)
- [ ] Social links maintain aria-label or title attributes for screen readers
- [ ] Menu items have visible focus indicators for keyboard navigation
- [ ] Color contrast ratios meet WCAG AA standard (4.5:1 minimum)
- [ ] Header semantic structure uses appropriate HTML5 tags (`<header>`, `<nav>`)

**Performance**:
- [ ] No hydration mismatch errors during SSR/CSR
- [ ] Header renders without blocking post content load
- [ ] No additional JavaScript bundle size increase (CSS-only responsive design)
- [ ] No layout recalculation on viewport resize

**Visual Quality**:
- [ ] Typography renders consistently across mobile browsers (Safari iOS, Chrome Android)
- [ ] Social icons appear crisp on high-DPI screens (2x, 3x retina)
- [ ] Border styling renders pixel-perfect (no anti-aliasing issues)
- [ ] Spacing values match Figma design (±1px tolerance)

**Browser Compatibility**:
- [ ] Works on Safari iOS 15+ (min supported version)
- [ ] Works on Chrome Android 100+ (min supported version)
- [ ] Works on Samsung Internet 18+ (common Android browser)
- [ ] Graceful degradation if Gothic A1 font fails to load

## Technical Requirements

### Implementation Approach

**Component Strategy**: Inline mobile header with responsive rendering

```tsx
// PostDetailPage.tsx - Recommended approach
export function PostDetailPage() {
  // ... existing logic ...

  return (
    <div className="px-4 md:px-[400px] py-[20px] flex flex-col gap-[20px]">
      {/* Mobile-only compact header */}
      <header className="flex md:hidden h-[80px] px-5 pt-5 items-start justify-between">
        <div className="flex items-center gap-[10px]">
          <Link to="/" className="text-[25px] font-normal font-['Gothic_A1'] text-black">
            Jake Park
          </Link>
          <div className="flex items-center gap-[23px]">
            {/* Social icons */}
          </div>
        </div>
        <nav className="flex items-center gap-[10px]">
          {/* Menu tabs */}
        </nav>
      </header>

      {/* Desktop header (existing shared component) */}
      <div className="hidden md:flex">
        <Header />
      </div>

      {/* Post content (unchanged) */}
      <article className="prose prose-lg max-w-none">
        {/* ... */}
      </article>
    </div>
  );
}
```

**Alternative**: Extract to `<MobilePostHeader />` component if complexity grows

### Layout Specifications

**Mobile Header Structure** (< 768px):
```
┌─────────────────────────────────────────┐
│ 20px padding                            │
│ ┌────────────┐           ┌──────────┐  │
│ │ Jake Park  │           │ Blog About│ │ 80px
│ │ [Li][Gh][Em]│          └──────────┘  │
│ └────────────┘                          │
└─────────────────────────────────────────┘
    ↑ 20px left          20px right ↑
```

**Desktop Header** (≥ 768px):
- Unchanged, uses existing `<Header />` component
- Vertical layout with bio text included

### Tailwind CSS Classes

```tsx
// Container
className="h-[80px] px-5 pt-5 flex md:hidden items-start justify-between"

// Left section (name + socials)
className="flex items-center gap-[10px]"

// Name
className="text-[25px] font-normal font-['Gothic_A1'] text-black"

// Socials container
className="flex items-center gap-[23px]"

// Social icon link
className="flex-shrink-0 w-5 h-5"

// Right section (menu)
className="flex items-center gap-[10px]"

// Menu item (active)
className="px-[5px] py-[8px] text-[20px] font-normal border-b-[3px] border-black"

// Menu item (inactive)
className="px-[5px] py-[8px] text-[20px] font-normal border-b-[3px] border-transparent hover:border-gray-300"
```

### Typography

**Fonts**:
- Name: Gothic A1, 25px, normal weight
- Menu items: 20px, normal weight
- No changes to post content typography (Tailwind Typography prose styles)

**Colors**:
- Text: `text-black` for name and active menu
- Social icons: `currentColor` (inherits parent color)
- Menu hover: `hover:border-gray-300`
- Active menu border: `border-black`

### Responsive Breakpoints

- Mobile: `< 768px` - New compact header
- Desktop: `≥ 768px` (`md:` prefix) - Existing shared header
- No tablet-specific breakpoint needed

### Accessibility Implementation

```tsx
// Social link example with accessibility
<a
  href="https://linkedin.com/in/eatnug"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="LinkedIn profile"
  className="flex-shrink-0 w-5 h-5 p-3" // 44x44px tap target with padding
>
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    {/* ... */}
  </svg>
</a>

// Menu item with focus indicator
<Link
  to="/?tab=blog"
  className={`px-[5px] py-[8px] text-[20px] font-normal border-b-[3px]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
    ${currentTab === 'blog' ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
>
  Blog
</Link>
```

## Design Specifications (from Figma 78:1236)

### Mobile Header Dimensions

**Container**:
- Width: 402px (full mobile viewport)
- Height: 80px
- Horizontal padding: 20px
- Top padding: 20px

**Title Section** (Name + Socials):
- Positioned at: x=20, y=24.5
- Total width: 186px
- Name: 110px width, 31px height
- Socials: 66px width, 20px height
- Vertical alignment: centered within section

**Menu Section**:
- Positioned at: x=262 (right side), y=20
- Total width: 120px
- Height: 40px
- Blog item: 48px width
- About item: 62px width
- Gap between items: 10px

### Post Content Spacing

**Post Container**:
- Starts at y=80 (immediately after header)
- Inner padding: 20px horizontal
- Title top margin: 20px
- Date position: 60px from top
- Content starts: 88px from top

## Best Practices Applied

**From Industry Research**:
- ✅ Minimum 16px content margin from screen edges (using 20px)
- ✅ Touch targets minimum 44x44px (iOS) / 48x48px (Android)
- ✅ Compact header saves valuable mobile screen space (160px → 80px)
- ✅ Hamburger menu avoided in favor of visible navigation (only 2 items)
- ✅ Responsive design with mobile-first CSS

**From Codebase Patterns**:
- ✅ Utility-first Tailwind CSS (no custom CSS files)
- ✅ Responsive breakpoint at 768px (`md:`)
- ✅ Gothic A1 font for branding consistency
- ✅ React Router Link components for navigation
- ✅ useLocation hook for active tab detection
- ✅ Shared SVG icons for social links

**From Accessibility Standards**:
- ✅ WCAG AA contrast ratio (4.5:1 minimum)
- ✅ Semantic HTML structure (`<header>`, `<nav>`, `<Link>`)
- ✅ Keyboard navigation with visible focus indicators
- ✅ Screen reader support via aria-labels
- ✅ Touch-friendly interaction zones

## Edge Cases & Constraints

### Edge Cases

**1. Very long post titles**
- Post titles may wrap to multiple lines
- Solution: Content starts at fixed 88px from top, title height is dynamic
- No impact on header (fixed 80px height)

**2. Development "Write" tab**
- Write tab only appears in development mode
- Mobile header does not include Write tab (not in design)
- Acceptable: Write feature is developer-only, not for public users

**3. Font loading failure**
- Gothic A1 may fail to load on slow connections
- Solution: Browser fallback to system sans-serif
- Verify fallback font maintains readability

**4. Small mobile devices (< 375px)**
- Menu items may collide with name section on very narrow screens
- Solution: Accept potential overlap as edge case (design assumes 375px+ width)
- Future consideration: Stack header elements or reduce font size

**5. Landscape orientation**
- Mobile device in landscape mode may have more horizontal space
- Solution: Design optimizes for portrait, landscape inherits same layout
- No separate landscape treatment needed

**6. RTL languages (future consideration)**
- Current design assumes LTR (left-to-right) layout
- Out of scope: RTL support not required in MVP
- Note: Would require `dir="rtl"` and mirrored layout

### Failure Scenarios

**React Router navigation failure**:
- If routing fails, menu items don't navigate
- Mitigation: React Router has built-in error boundary, redirects handled at app level
- Impact: Low (routing is stable, well-tested library)

**SVG icon rendering failure**:
- Social icons may not render if SVG fails
- Mitigation: Inline SVG reduces external dependency risk
- Fallback: Text labels could be added if visual verification fails

**CSS class name collision**:
- Tailwind classes may conflict with existing styles
- Mitigation: Tailwind scopes utilities, no global conflicts expected
- Testing: Visual regression test on build

**Breakpoint mismatch during resize**:
- User resizes browser window, crosses 768px threshold
- Expected: Smooth transition via CSS media queries
- Testing: Verify no FOUC (flash of unstyled content)

### Data Consistency

**Active tab state**:
- Menu active state must sync with URL/route
- Current implementation: `useLocation` hook ensures consistency
- No changes needed: Logic already handles `/posts/:slug` → Blog active

**Post data loading**:
- Header renders before post data loads
- Current behavior: Header shows during loading state
- Preserved: New mobile header also renders immediately

**Document title**:
- Title updates when post data loads
- Current implementation: `useEffect` with `post?.title` dependency
- No changes needed: Logic remains unchanged

## Success Metrics

**User Experience**:
- Mobile users can access navigation 50% faster (80px header vs 160px scroll distance)
- No increase in navigation errors or mis-taps
- Positive user feedback on cleaner mobile UI

**Technical Performance**:
- No regression in Lighthouse mobile score (maintain 90+ performance)
- Header renders in < 100ms on mobile devices
- No hydration errors in production logs

**Visual Quality**:
- Design QA approval: 100% match with Figma specs (±1px tolerance)
- No visual regression across supported browsers (Safari iOS, Chrome Android)
- Consistent rendering on devices from iPhone SE to iPad mini

## Out of Scope

- ❌ Desktop/tablet post detail page changes (≥ 768px)
- ❌ Other mobile pages (Blog list, About, Editor)
- ❌ Modifications to shared `Header.tsx` component
- ❌ Draft post placeholder logic changes ("✍️ing...")
- ❌ Responsive breakpoint adjustments (keep 768px)
- ❌ Data fetching or business logic changes
- ❌ Navigation/routing structure changes
- ❌ Analytics tracking or event logging
- ❌ A11y features beyond visual compliance (e.g., screen reader optimization)
- ❌ Sticky header behavior (header scrolls with content)
- ❌ Dark mode support (not in current design system)
- ❌ Animation/transition effects (static layout change)

## Open Questions

- [ ] Should social icons have tooltips on hover/long-press? → TBD in PLAN phase
- [ ] Do we need visual regression tests for this change? → Recommended, setup in PLAN
- [ ] Should we extract mobile header to separate component for reusability? → Decide during implementation
- [ ] What's the minimum supported mobile viewport width? → Assume 375px (iPhone SE), verify with product
- [ ] Should menu items have ripple effect on tap (Material Design pattern)? → Out of scope, keep simple

## Related Files

### Files to Modify

1. **[src/presentation/pages/post-detail/PostDetailPage.tsx](src/presentation/pages/post-detail/PostDetailPage.tsx)**
   - Main implementation file
   - Add mobile-specific header inline or as component
   - Conditional rendering based on breakpoint

### Files to Reference (No Changes)

2. **[src/presentation/layouts/Header.tsx](src/presentation/layouts/Header.tsx)**
   - Existing shared header component
   - Used for desktop post detail and all other pages
   - Copy social icons SVG code from here

3. **[src/presentation/globals.css](src/presentation/globals.css)**
   - Global CSS and design tokens
   - May need to verify custom font loading
   - No modifications expected (Tailwind utilities sufficient)

## Next Steps

- [ ] Create PLAN document with detailed task breakdown
- [ ] Set up local Figma access or extract exact color values
- [ ] Write visual regression test plan (screenshot comparison)
- [ ] Implement mobile header component/inline layout
- [ ] Test on physical mobile devices (iOS Safari, Chrome Android)
- [ ] Accessibility audit with screen reader (VoiceOver, TalkBack)
- [ ] Performance audit with Lighthouse mobile
- [ ] Product design review (QA against Figma)
- [ ] Cross-browser compatibility testing
- [ ] Documentation update (if component extracted)
