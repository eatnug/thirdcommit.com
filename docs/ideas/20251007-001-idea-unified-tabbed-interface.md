# 20251007-001: Unified Tabbed Interface

**Created**: 2025-10-07
**Status**: IDEA

## User Request

UI 갈아엎으려고해. 지금은 랜딩페이지가 있고 블로그페이지가 따로 있고 그런데 그냥 같은 리스트 UI 하나에서 탭 왔다갔다 하는걸로 바꾸고싶어.

### Figma Designs
- Web Post List: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=1-24&t=uQTK6V7MAUECj3Oy-11
- Web Post Detail: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=9-750&t=uQTK6V7MAUECj3Oy-11
- Mobile Post List: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-446&t=uQTK6V7MAUECj3Oy-11
- Mobile Post Detail: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=9-861&t=uQTK6V7MAUECj3Oy-11
- Web Project List: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=7-231&t=uQTK6V7MAUECj3Oy-11
- Mobile Project List: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-401&t=uQTK6V7MAUECj3Oy-11
- Web Local Mode: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-579&t=uQTK6V7MAUECj3Oy-11
- Editor Web: https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=8-649&t=uQTK6V7MAUECj3Oy-11
- Editor Web (Preview): https://www.figma.com/design/xGdklVljCkVjA8L9ZzLYxj/blog?node-id=9-920&t=uQTK6V7MAUECj3Oy-11

---

## Current System Overview

### Architecture
- **Framework**: Next.js 15 with App Router
- **Architecture Pattern**: Volatility-based hexagonal architecture (documented in [docs/kb/ARCHITECTURE.md](../kb/ARCHITECTURE.md))
- **Styling**: Mixed (Tailwind + custom CSS in `page.css`)
- **Deployment**: Static export to GitHub Pages

### Current User Flows

#### 1. Landing Page (`/`)
- Standalone page with no navigation header
- Custom CSS-based layout ([app/page.css](../../app/page.css))
- Hardcoded projects section
- Link to `/blog` page

#### 2. Blog List Page (`/blog`)
- Separate route with navigation header via `(with-nav)` route group
- Server component fetching posts from filesystem
- Grid layout with PostCard components
- Uses Tailwind for styling

#### 3. Post Detail Page (`/posts/[slug]`)
- Dynamic route with static generation
- "Back to posts" button goes to `/` (not `/blog`)
- Edit button in dev mode links to `/editor?id={postId}`

#### 4. Editor Page (`/editor`) - Dev Only
- Markdown editor with live preview
- Draft management
- Client-side with API routes

### Data Architecture

#### Posts
- **Storage**: `/storage/posts/*.md` (markdown with YAML frontmatter)
- **Repository**: `FileSystemPostRepository` (server) / API-based (client)
- **Domain Layer**: `src/domain/blog/`
- **Policy**: `PostVisibilityPolicy` filters published vs. draft posts

#### Projects
- **Current**: Hardcoded in [app/page.tsx](../../app/page.tsx)
- **No domain layer or repository**

---

## Related Code

### High Impact Files (Must Change)

#### Presentation Layer
- [app/page.tsx](../../app/page.tsx) - Landing page component, will become unified tabbed interface
- [app/page.css](../../app/page.css) - Custom CSS for landing, will be migrated to Tailwind
- [app/(with-nav)/blog/page.tsx](../../app/(with-nav)/blog/page.tsx) - Blog list page, will be removed/redirected
- [app/(with-nav)/layout.tsx](../../app/(with-nav)/layout.tsx) - Navigation header, needs updates for new structure
- [app/(with-nav)/posts/[slug]/page.tsx](../../app/(with-nav)/posts/[slug]/page.tsx) - Post detail, back button behavior

#### Components
- [app/(with-nav)/blog/_components/post-card.tsx](../../app/(with-nav)/blog/_components/post-card.tsx) - Reusable for blog tab
- [app/_components/card.tsx](../../app/_components/card.tsx) - May need variants for project cards
- [app/_components/button.tsx](../../app/_components/button.tsx) - Tab buttons
- [app/_components/separator.tsx](../../app/_components/separator.tsx) - May be useful for layout

#### Configuration
- [next.config.ts](../../next.config.ts) - Add redirect from `/blog` to `/`

### Medium Impact Files (May Need Changes)

#### Styling
- [app/globals.css](../../app/globals.css) - Global Tailwind config
- Remove `app/page.css` after migration

#### Metadata
- [app/layout.tsx](../../app/layout.tsx) - Root layout, may need metadata updates

### No Changes Needed

#### Domain & Infrastructure Layers
- [src/domain/blog/](../../src/domain/blog/) - Business logic unchanged
- [src/infrastructure/blog/](../../src/infrastructure/blog/) - Data access unchanged
- [app/editor/](../../app/editor/) - Editor continues to work as-is
- [app/api/](../../app/api/) - API routes for editor (dev only)

---

## Related Knowledge Base

- [docs/kb/ARCHITECTURE.md](../kb/ARCHITECTURE.md) - Volatility-based hexagonal architecture
  - Three-tier architecture (Volatile/Moderate/Stable)
  - Ports & Adapters pattern
  - Repository pattern usage
  - Route group conventions

### Observable Patterns (Not Formally Documented)
- **Toggle-based layout**: Editor uses toggle to show/hide preview panel
- **Grid-based list views**: Blog uses Tailwind grid with PostCard components
- **Route groups**: `(with-nav)/` for pages with navigation header
- **Card component patterns**: shadcn-style Card with Header, Title, Description, Content

---

## Requirements Clarification

### Q1: Tab behavior & URL
**Q**: Should tabs be reflected in URL?
**A**: Yes, use URL parameters without full page refresh (client-side routing)

### Q2: Back button in post detail
**Q**: Where should "Back to posts" go?
**A**: Just go back (browser back), since About/Projects don't have detail pages

### Q3: URL structure
**Q**: What should happen to `/blog` route?
**A**:
- Landing: `/`
- Blog list: `/?tab=blog` or just `/` with blog tab activated
- Post detail: `/posts?id={slug}`
- Redirect `/blog` → `/` with blog tab active

### Q4: Projects data source
**Q**: Should projects be dynamic like posts?
**A**: Yes, but simpler:
- Tab name: "About"
- Data name: "Projects"
- Similar domain layer structure
- Repository returns hardcoded array of objects (no filesystem)

### Q5: Projects metadata
**Q**: What fields do projects need?
**A**:
- `title`
- `description`
- `externalLink`
- No reading time, dates, or tags

### Q6: Styling approach
**Q**: Keep custom CSS or convert to Tailwind?
**A**: Use Tailwind throughout the entire project

### Q7: Navigation header
**Q**: Should tabbed view have navigation header?
**A**: Follow Figma designs (disregard current UI)

### Q8: Local mode / Editor
**Q**: What is "Web Local Mode" in Figma?
**A**:
- Same as current `/editor` page
- Show "Write" menu in header only in local development
- Should be accessible from main interface in dev mode

### Q9: Tags feature
**Q**: Should tags be implemented?
**A**: No, not needed

### Q10: Mobile behavior
**Q**: Should tabs change on mobile?
**A**: No dropdown, just follow Figma design

---

## Initial Scope

### Phase 1: Domain Layer for Projects
- [ ] Create `Project` entity in `src/domain/projects/`
- [ ] Create `ProjectRepository` interface (port)
- [ ] Implement `InMemoryProjectRepository` returning hardcoded array
- [ ] Create `getProjects()` use case
- [ ] Create `ProjectApi` factory function

### Phase 2: URL Structure Changes
- [ ] Change post detail route from `/posts/[slug]` to `/posts?id={slug}`
- [ ] Add redirect from `/blog` to `/?tab=blog` in `next.config.ts`
- [ ] Update all internal links to use new URLs

### Phase 3: Component Development
- [ ] Create tab navigation component (client component with URL sync)
- [ ] Create `ProjectCard` component (similar to `PostCard`)
- [ ] Extract projects data into repository
- [ ] Create unified list layout component

### Phase 4: Page Restructuring
- [ ] Rewrite `/app/page.tsx` as tabbed interface
- [ ] Remove or redirect `/app/(with-nav)/blog/page.tsx`
- [ ] Update navigation header for Figma design
- [ ] Add "Write" menu item (dev only)

### Phase 5: Styling Migration
- [ ] Convert `page.css` styles to Tailwind
- [ ] Ensure responsive design matches Figma (mobile + web)
- [ ] Remove `page.css` file

### Phase 6: Testing & Deployment
- [ ] Test static export build
- [ ] Verify all redirects work
- [ ] Test navigation and tab switching
- [ ] Test editor integration in dev mode
- [ ] Deploy to GitHub Pages

---

## Out of Scope

### Explicitly Excluded
- Tags feature implementation
- Dynamic projects from markdown files (use hardcoded array instead)
- Post reading time/dates for projects
- Separate mobile dropdown navigation
- Any changes to domain/infrastructure layers for blog posts
- Editor functionality changes

### Future Considerations
- Migration from hardcoded projects to filesystem-based storage
- Advanced filtering/sorting in list views
- Search functionality
- Animation/transitions for tab switching

---

## Technical Decisions

### 1. URL Structure
**Decision**: Use query parameters for tabs
- `/` - Default to "About" tab (projects)
- `/?tab=blog` - Blog posts list
- `/posts?id={slug}` - Post detail page

**Rationale**:
- Works well with Next.js App Router
- Supports static export
- Shareable URLs
- Browser back/forward support

### 2. Tab State Management
**Decision**: Client-side component with URL synchronization
**Implementation**: Use `useSearchParams()` + `router.push()` for client-side navigation without full refresh

### 3. Projects Repository
**Decision**: In-memory repository with hardcoded data
**Rationale**:
- Maintains architectural consistency
- Easy to migrate to filesystem later
- No build-time complexity
- Fast and simple

### 4. Styling Approach
**Decision**: Migrate all custom CSS to Tailwind
**Rationale**:
- Consistent styling system
- Better maintainability
- Matches existing blog components
- Follows Figma designs

### 5. Navigation Structure
**Decision**: Single header for all pages, "Write" menu only in dev
**Implementation**:
- Move navigation out of `(with-nav)` route group
- Check `process.env.NODE_ENV` for "Write" menu visibility
- Apply to all pages including landing

---

## Impact Analysis

### Breaking Changes
1. **URL Changes**
   - `/blog` → `/?tab=blog` (with redirect)
   - `/posts/[slug]` → `/posts?id={slug}` (breaking change for external links)

2. **Layout Changes**
   - Landing page now has navigation header
   - Blog is no longer a separate page

3. **Visual Changes**
   - Complete UI overhaul to match Figma
   - Custom CSS removed in favor of Tailwind

### Migration Strategy
1. Add redirects for old URLs
2. Update all internal links first
3. Test static export thoroughly
4. Consider keeping old routes temporarily with redirects

### Risks
- **External links**: Any external sites linking to `/blog` or `/posts/[slug]` may break
- **SEO**: URL structure changes may temporarily affect search rankings
- **Bookmarks**: User bookmarks to old URLs require redirects
- **Static export**: Query parameter routing must work with GitHub Pages

### Mitigation
- Add permanent redirects (301) for old URLs
- Update sitemap.xml
- Test all redirect scenarios
- Consider meta refresh fallback for GitHub Pages

---

## Next Steps

1. [ ] Review and approve this IDEA document
2. [ ] Create detailed SPEC document with:
   - Component API specifications
   - Detailed URL routing table
   - Figma design breakdown
   - Acceptance criteria
3. [ ] Research best practices for:
   - Client-side URL synchronization without full refresh
   - Static export with query parameters on GitHub Pages
4. [ ] Create implementation plan with task breakdown

---

## Open Questions

1. Should we keep the old `/posts/[slug]` route as a redirect to `/posts?id={slug}`, or break external links?
2. What should be the default tab when visiting `/` - About or Blog?
3. Should the tab selection persist across sessions (localStorage)?
4. Do we need loading states when switching tabs?
5. Should URL changes be pushed to history or replaced?

---

## Success Criteria

✅ Single unified interface with tab navigation
✅ About (Projects) and Blog tabs at `/`
✅ All styling migrated to Tailwind
✅ Navigation header on all pages
✅ "Write" menu visible only in dev mode
✅ Redirects from old URLs working
✅ Static export builds successfully
✅ Mobile and desktop views match Figma
✅ No breaking changes to domain/infrastructure layers
✅ Editor continues to work in dev mode
