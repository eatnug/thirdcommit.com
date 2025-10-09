# 20251009-001-PLAN: Google Analytics 4 Setup

**Created**: 2025-10-09
**Status**: PLAN
**Based on**: `docs/specs/20251009-001-spec-google-analytics-setup.md`

## Architecture Design

### Overview

Client-side analytics tracking using Google Analytics 4 (GA4) gtag.js with custom React Router integration for Single-Page Application (SPA) route tracking. No backend changes required - entirely frontend implementation with build-time environment variable injection.

### System Components

#### Frontend Components

**1. GA4 Script Integration** ([index.html](../../index.html))
- **GA4 gtag.js Script**: Loaded asynchronously in `<head>`
- **Inline Configuration Script**: Initialize gtag with measurement ID
- **Environment Variable**: `%VITE_GA_MEASUREMENT_ID%` replaced at build time
- **Automatic Page View**: Disabled (`send_page_view: false`) to prevent duplicate tracking

**2. Custom React Hook** (`src/hooks/usePageTracking.ts`)
- **usePageTracking**: Detects route changes via React Router's `useLocation`
- **Manual Page View Events**: Fires `page_view` event with full URL context
- **Editor Page Exclusion**: Skips tracking for `/editor` route
- **TypeScript Types**: Global `window.gtag` type declaration

**3. App Integration** ([src/presentation/App.tsx](../../src/presentation/App.tsx))
- **Hook Initialization**: Call `usePageTracking()` at app root
- **React Router Context**: Hook accesses `useLocation` from `<BrowserRouter>`

**4. Environment Configuration**
- **`.env.local.example`**: Template with `VITE_GA_MEASUREMENT_ID`
- **`.env.local`**: Developer creates with actual GA4 measurement ID
- **Vite HTML Transform**: Automatically replaces `%VITE_GA_MEASUREMENT_ID%` in HTML

**5. Build Process**
- **Vite Build**: Injects env var into `index.html` during build
- **Static HTML Generation**: GA4 script included in pre-rendered HTML
- **GitHub Pages Deployment**: Functional analytics on static site

### Data Flow

#### Initial Page Load
```
User visits site (/)
  → Browser loads HTML with GA4 script in <head>
  → gtag.js script loads asynchronously
  → window.gtag function becomes available
  → React app mounts, App.tsx renders
  → usePageTracking() hook initializes
  → useEffect runs with initial location
  → Check: window.gtag exists? ✓
  → Check: location.pathname !== '/editor'? ✓
  → Fire page_view event with:
      - page_path: "/" (pathname + search + hash)
      - page_location: "https://thirdcommit.com/"
      - page_title: "Jake Park - Software Engineer"
  → GA4 receives event, processes in Analytics dashboard
```

#### SPA Route Navigation
```
User clicks blog post link (/posts/my-article)
  → React Router navigates to /posts/my-article
  → useLocation() detects location change
  → useEffect in usePageTracking() fires
  → Check: window.gtag exists? ✓
  → Check: location.pathname !== '/editor'? ✓
  → Fire page_view event with:
      - page_path: "/posts/my-article"
      - page_location: "https://thirdcommit.com/posts/my-article"
      - page_title: "My Article - Jake Park"
  → GA4 receives event, updates session data
```

#### Editor Page (Development Only)
```
Developer navigates to /editor
  → useLocation() detects location change
  → useEffect in usePageTracking() fires
  → Check: location.pathname !== '/editor'? ✗
  → Return early, no page_view event fired
  → Editor usage not tracked (privacy for internal tool)
```

#### Ad Blocker / Privacy Extension
```
User has ad blocker enabled
  → Browser blocks gtag.js script load
  → window.gtag remains undefined
  → usePageTracking() hook runs normally
  → Check: window.gtag exists? ✗
  → Return early, silent failure
  → Site functions normally without analytics
```

### Architecture Diagram (Text)
```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ index.html (Static HTML)                               │ │
│  │                                                         │ │
│  │  <head>                                                 │ │
│  │    <script async src="gtag.js?id=G-NF9WK1TVFC">       │ │
│  │    <script>                                            │ │
│  │      window.dataLayer = [];                            │ │
│  │      function gtag(){dataLayer.push(arguments);}       │ │
│  │      gtag('config', 'G-NF9WK1TVFC', {                 │ │
│  │        send_page_view: false                           │ │
│  │      });                                               │ │
│  │    </script>                                           │ │
│  │  </head>                                               │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │ Loads async                         │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ window.gtag (Google Analytics Function)               │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │ Used by                             │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ React App (src/presentation/App.tsx)                   │ │
│  │                                                         │ │
│  │  usePageTracking() ─────► useLocation() (React Router)│ │
│  │       │                                                 │ │
│  │       │ On location change:                            │ │
│  │       ├─► Check window.gtag exists                     │ │
│  │       ├─► Check not /editor                            │ │
│  │       └─► Fire gtag('event', 'page_view', {...})      │ │
│  │                                                         │ │
│  │  <Routes>                                              │ │
│  │    <Route path="/" ... />                             │ │
│  │    <Route path="/posts/:slug" ... />                  │ │
│  │    <Route path="/editor" ... />  (not tracked)        │ │
│  │  </Routes>                                             │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │ page_view events                    │
│                        ▼                                     │
│  ┌───────────────────────────────────────��────────────────┐ │
│  │ dataLayer (Google Analytics Buffer)                    │ │
│  └─────────────────────┬──────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTPS
                         ▼
         ┌────────────────────────────────┐
         │ Google Analytics 4 (GA4)       │
         │                                │
         │ - Processes page_view events   │
         │ - Tracks traffic sources       │
         │ - Calculates metrics           │
         │ - Powers GA4 dashboard         │
         └────────────────────────────────┘
```

---

## API Contract

**Not applicable** - This is a frontend-only feature with no backend API changes.

GA4 uses Google's external API endpoints for data collection:
- `https://www.googletagmanager.com/gtag/js?id=G-NF9WK1TVFC` (script load)
- `https://www.google-analytics.com/g/collect` (event collection endpoint)

All communication is client-side, browser → Google Analytics.

---

## Task Breakdown

### Frontend Tasks

#### 20251009-001-FE-T1: Add GA4 Script to index.html
**Complexity**: S
**Description**: Add GA4 gtag.js script tags to `<head>` section with environment variable placeholders
**Dependencies**: None
**Estimated Time**: 15 minutes

**Subtasks**:
- Add async gtag.js script tag with `%VITE_GA_MEASUREMENT_ID%`
- Add inline configuration script with `send_page_view: false`
- Initialize `window.dataLayer` array
- Verify script placement in `<head>` before other scripts

**Acceptance Criteria**:
- ✅ Script tag uses `async` attribute
- ✅ Measurement ID uses `%VITE_GA_MEASUREMENT_ID%` placeholder
- ✅ `send_page_view: false` configured to prevent duplicate events
- ✅ No build errors after changes

**Files Modified**:
- [index.html](../../index.html)

---

#### 20251009-001-FE-T2: Create usePageTracking Hook
**Complexity**: S
**Description**: Create custom React hook to track route changes with GA4
**Dependencies**: FE-T1
**Estimated Time**: 30 minutes

**Subtasks**:
- Create `src/hooks/usePageTracking.ts`
- Add TypeScript global type declaration for `window.gtag`
- Import `useLocation` from `react-router-dom`
- Implement `useEffect` to fire `page_view` on location change
- Add check for `window.gtag` existence (ad blocker handling)
- Add check to exclude `/editor` route from tracking
- Include `page_path`, `page_location`, and `page_title` in event data

**Acceptance Criteria**:
- ✅ Hook correctly detects route changes via `useLocation`
- ✅ `page_view` event fires with full URL context
- ✅ `/editor` route is not tracked
- ✅ No errors if `window.gtag` is undefined (ad blocker scenario)
- ✅ TypeScript types compile without errors
- ✅ Hook works with React Router v6+ patterns

**Files Created**:
- `src/hooks/usePageTracking.ts`

---

#### 20251009-001-FE-T3: Initialize Hook in App.tsx
**Complexity**: S
**Description**: Import and initialize `usePageTracking` hook in main App component
**Dependencies**: FE-T2
**Estimated Time**: 10 minutes

**Subtasks**:
- Import `usePageTracking` from `@/hooks/usePageTracking`
- Call `usePageTracking()` at top of `App` component function
- Verify hook is inside `<BrowserRouter>` context (check `main.tsx`)
- Test that hook runs on initial mount and route changes

**Acceptance Criteria**:
- ✅ Hook called before JSX return in `App` component
- ✅ Hook has access to React Router context (no "useLocation must be used within Router" error)
- ✅ No console errors or warnings
- ✅ App still renders correctly after changes

**Files Modified**:
- [src/presentation/App.tsx](../../src/presentation/App.tsx)

---

#### 20251009-001-FE-T4: Update Environment Variable Config
**Complexity**: S
**Description**: Add GA4 measurement ID to environment variable examples
**Dependencies**: None (can run in parallel with FE-T1)
**Estimated Time**: 5 minutes

**Subtasks**:
- Open `.env.local.example`
- Add comment section for Google Analytics
- Add `VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"` template
- Update comment to note this is the GA4 measurement ID format

**Acceptance Criteria**:
- ✅ `.env.local.example` includes `VITE_GA_MEASUREMENT_ID` template
- ✅ Comment explains this is for Google Analytics 4
- ✅ Example ID uses correct format (`G-` prefix)
- ✅ File follows existing formatting style

**Files Modified**:
- `.env.local.example`

**Developer Action Required**:
- Developer must create `.env.local` with actual measurement ID: `G-NF9WK1TVFC`

---

#### 20251009-001-FE-T5: Test Development Build
**Complexity**: S
**Description**: Test analytics integration in development environment
**Dependencies**: FE-T1, FE-T2, FE-T3, FE-T4
**Estimated Time**: 20 minutes

**Subtasks**:
- Create `.env.local` with real `VITE_GA_MEASUREMENT_ID=G-NF9WK1TVFC`
- Run `npm run dev`
- Open browser DevTools → Network tab
- Navigate through site (home → blog post → home)
- Verify gtag.js script loads
- Verify `page_view` events sent to Google Analytics (check Network → Filter: `google-analytics.com/g/collect`)
- Check Console for any errors
- Verify `/editor` route does NOT send events

**Acceptance Criteria**:
- ✅ gtag.js script loads successfully (Network tab)
- ✅ `page_view` events visible in Network tab for tracked pages
- ✅ Event includes `page_path`, `page_location`, `page_title` parameters
- ✅ No events for `/editor` route
- ✅ No console errors related to analytics
- ✅ Site functions normally with analytics enabled

**Testing Checklist**:
- [ ] Initial page load sends 1 event
- [ ] Navigation to blog post sends 1 event
- [ ] Back/forward navigation sends events
- [ ] Navigation to `/editor` sends 0 events

---

#### 20251009-001-FE-T6: Test Production Build
**Complexity**: M
**Description**: Test analytics in production build with env var replacement
**Dependencies**: FE-T5
**Estimated Time**: 30 minutes

**Subtasks**:
- Run `npm run build`
- Verify `dist/index.html` has `G-NF9WK1TVFC` (not `%VITE_GA_MEASUREMENT_ID%`)
- Run `npm run preview` to serve production build
- Test analytics tracking (same checklist as FE-T5)
- Verify bundle size impact (should be minimal, gtag is async)
- Check Lighthouse Performance score (should not degrade > 5 points)

**Acceptance Criteria**:
- ✅ Environment variable correctly replaced in built HTML
- ✅ Production build functions identically to dev
- ✅ Analytics tracking works in production mode
- ✅ No "undefined" or placeholder values in script tags
- ✅ Performance metrics acceptable (Lighthouse score)

**Performance Validation**:
- [ ] Time to Interactive (TTI) increase < 100ms
- [ ] First Contentful Paint (FCP) unchanged
- [ ] Lighthouse Performance score not degraded by > 5 points

---

#### 20251009-001-FE-T7: Validate with GA4 DebugView
**Complexity**: M
**Description**: Use GA4 DebugView to validate real-time event tracking
**Dependencies**: FE-T6
**Estimated Time**: 30 minutes

**Subtasks**:
- Open Google Analytics 4 dashboard
- Navigate to Admin → DebugView
- Enable debug mode in browser (add `?debug_mode=true` to URL, or use GA Debugger extension)
- Perform test navigation flows on site
- Verify events appear in DebugView in real-time
- Check event parameters are correct
- Verify traffic sources tracked correctly (direct, referral, etc.)

**Acceptance Criteria**:
- ✅ `page_view` events appear in GA4 DebugView within seconds
- ✅ Event parameters match expected values:
  - `page_path`: correct path
  - `page_location`: full URL
  - `page_title`: correct title
- ✅ Traffic source shows "Direct" for direct visits
- ✅ No errors or warnings in DebugView
- ✅ Session tracking works correctly (events grouped by session)

**Validation Checklist**:
- [ ] Homepage page_view tracked
- [ ] Blog post page_view tracked with correct slug
- [ ] Navigation flow creates single session
- [ ] Bounce rate calculated correctly
- [ ] Session duration shows reasonable values

---

#### 20251009-001-FE-T8: Document Setup Instructions
**Complexity**: S
**Description**: Document GA4 setup process for future reference (optional)
**Dependencies**: FE-T7
**Estimated Time**: 15 minutes

**Subtasks**:
- Update README.md (or create separate ANALYTICS.md) with:
  - How to obtain GA4 measurement ID
  - How to set up `.env.local`
  - How to test analytics locally
  - How to verify tracking in GA4 DebugView
- Add troubleshooting section for common issues (ad blockers, missing env var)

**Acceptance Criteria**:
- ✅ Clear step-by-step setup instructions
- ✅ Links to GA4 documentation
- ✅ Troubleshooting section included
- ✅ Instructions tested by following docs from scratch

**Files Modified**:
- `README.md` (or create `ANALYTICS.md`)

---

#### 20251009-001-FE-T9: Deploy and Monitor
**Complexity**: S
**Description**: Deploy to production and monitor GA4 for 24 hours
**Dependencies**: FE-T7, FE-T8
**Estimated Time**: Deployment: 10 min, Monitoring: 24 hours

**Subtasks**:
- Ensure `VITE_GA_MEASUREMENT_ID` set in deployment environment (if needed)
- Deploy to GitHub Pages: `npm run deploy`
- Verify analytics script in deployed HTML (view source)
- Monitor GA4 dashboard for first 24 hours
- Check Realtime report for live visitors
- Validate data quality in standard reports

**Acceptance Criteria**:
- ✅ Live site includes GA4 script with correct measurement ID
- ✅ Page views appearing in GA4 Realtime report
- ✅ Traffic sources tracking correctly
- ✅ No errors in GA4 dashboard
- ✅ Session metrics showing reasonable values

**24-Hour Validation**:
- [ ] Page views recorded
- [ ] Unique visitors counted
- [ ] Traffic sources attributed
- [ ] Bounce rate calculated
- [ ] Session duration tracked
- [ ] No data anomalies or issues

---

## Task Dependencies & Execution Plan

### Dependency Graph

```
FE-T1 (GA4 Script)
  └─► FE-T2 (usePageTracking Hook)
        └─► FE-T3 (Initialize in App)

FE-T4 (Env Config) ─┐
                    ├─► FE-T5 (Dev Testing)
FE-T1, FE-T2, FE-T3 ┘     └─► FE-T6 (Prod Testing)
                                └─► FE-T7 (GA4 Validation)
                                      ├─► FE-T8 (Documentation)
                                      └─► FE-T9 (Deploy & Monitor)
```

### Execution Sequence

**Phase 1: Implementation** (1 session, ~1 hour)
- FE-T4 (5 min) - Run first (no dependencies)
- FE-T1 (15 min) - Add GA4 script
- FE-T2 (30 min) - Create hook
- FE-T3 (10 min) - Initialize hook

**Phase 2: Testing** (1 session, ~1.5 hours)
- FE-T5 (20 min) - Dev testing
- FE-T6 (30 min) - Prod testing
- FE-T7 (30 min) - GA4 validation

**Phase 3: Documentation & Deployment** (1 session, 25 min + 24hr monitoring)
- FE-T8 (15 min) - Documentation
- FE-T9 (10 min deploy + 24hr monitoring)

### Parallel Opportunities
- FE-T4 can start immediately (independent)
- FE-T8 can be done while waiting for GA4 data to populate

### Critical Path
FE-T1 → FE-T2 → FE-T3 → FE-T5 → FE-T6 → FE-T7 → FE-T9 (7 tasks)

**Estimated Timeline**:
- Implementation: 1 hour
- Testing: 1.5 hours
- Documentation: 15 minutes
- Deployment: 10 minutes
- Monitoring: 24 hours (passive)
- **Total Active Time**: ~3 hours
- **Total Calendar Time**: 24-48 hours (including monitoring)

---

## Technology Stack Additions

**No new npm dependencies required**

**External Services**:
- Google Analytics 4 (GA4) - gtag.js loaded via CDN

**Development Tools** (optional):
- GA Debugger Chrome Extension (for testing)

---

## Environment Variables

### Required Variables

**`VITE_GA_MEASUREMENT_ID`**
- **Format**: `G-XXXXXXXXXX` (GA4 format)
- **Value**: `G-NF9WK1TVFC` (from existing `.env.local.example`)
- **Usage**: Injected into `index.html` at build time
- **Scope**: Public (client-side, visible in page source)

### Configuration Files

**`.env.local.example`** (template):
```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**`.env.local`** (developer creates):
```bash
VITE_GA_MEASUREMENT_ID="G-NF9WK1TVFC"
```

### Build-time Replacement

Vite automatically replaces `%VITE_GA_MEASUREMENT_ID%` in HTML during build:
- **Development**: `npm run dev` uses `.env.local`
- **Production**: `npm run build` uses `.env.local` or deployment env vars
- **GitHub Pages**: Ensure env var set in GitHub Actions (if applicable)

---

## Risks & Mitigations

### Risk 1: Environment Variable Not Replaced
**Likelihood**: Medium
**Impact**: High (analytics won't work)

**Scenario**: `%VITE_GA_MEASUREMENT_ID%` appears literally in built HTML

**Mitigation**:
- Test production build locally before deploying (FE-T6)
- Verify `dist/index.html` contains actual ID, not placeholder
- Add build-time validation to warn if env var missing

**Fallback**:
- Site still functions without analytics (graceful degradation)
- Fix env var and rebuild

---

### Risk 2: Ad Blockers Prevent Tracking
**Likelihood**: High (30-40% of users)
**Impact**: Low (expected, acceptable)

**Scenario**: gtag.js script blocked, `window.gtag` undefined

**Mitigation**:
- Hook checks `if (!window.gtag) return;` before calling
- No console errors or broken site behavior
- Analytics data represents "trackable" users only (industry standard)

**Acceptance**:
- Cannot bypass ad blockers (by design)
- 60-70% tracking coverage typical and acceptable

---

### Risk 3: Duplicate Page View Events
**Likelihood**: Low
**Impact**: Medium (inflates metrics)

**Scenario**: Both automatic and manual `page_view` events fire

**Mitigation**:
- Set `send_page_view: false` in gtag config (FE-T1)
- Test with Network tab to verify only 1 event per navigation (FE-T5)
- Use GA4 DebugView to confirm event count (FE-T7)

**Detection**:
- Page views 2x expected in GA4 dashboard
- Multiple events with same timestamp in DebugView

---

### Risk 4: React Router Context Missing
**Likelihood**: Low
**Impact**: High (hook crashes)

**Scenario**: `usePageTracking` called outside `<BrowserRouter>`

**Mitigation**:
- Verify `App` component is rendered inside `<BrowserRouter>` (check `main.tsx`)
- Test in development to catch error early (FE-T5)
- Error message clearly indicates "useLocation must be used within Router"

**Fix**: Ensure `<BrowserRouter>` wraps `<App />` in entry point

---

### Risk 5: Performance Degradation
**Likelihood**: Low
**Impact**: Medium (slower site)

**Scenario**: gtag.js script blocks page load

**Mitigation**:
- Use `async` attribute on script tag (FE-T1)
- Load gtag.js from CDN (fast, likely cached)
- Test Lighthouse score before/after (FE-T6)

**Acceptance Criteria**:
- TTI increase < 100ms
- Lighthouse Performance score drop < 5 points

---

## Edge Cases & Handling

### 1. Missing Measurement ID
**Scenario**: `.env.local` not created or `VITE_GA_MEASUREMENT_ID` not set

**Behavior**:
- `%VITE_GA_MEASUREMENT_ID%` appears literally in HTML
- gtag.js fails to load (invalid ID)
- `window.gtag` undefined

**Handling**:
- Hook safely returns early (no crash)
- Site functions without analytics
- Developer sees warning in console (gtag error)

**Fix**: Create `.env.local` with correct ID

---

### 2. Ad Blocker Enabled
**Scenario**: Browser extension blocks `googletagmanager.com`

**Behavior**:
- gtag.js script request blocked
- `window.gtag` remains undefined

**Handling**:
- Hook checks `if (!window.gtag) return;`
- No page_view events sent (silent failure)
- No console errors or user-visible issues

**Expected**: 30-40% of users, acceptable data loss

---

### 3. Editor Page Navigation
**Scenario**: Developer navigates to `/editor` (development only)

**Behavior**:
- `useLocation` detects path change
- Hook checks `if (location.pathname === '/editor') return;`
- No page_view event fired

**Rationale**: Internal tool, not public content

**Edge Case**: Production builds exclude `/editor` route via `import.meta.env.DEV` check

---

### 4. Hash-only Navigation
**Scenario**: User clicks link to `/#section` on same page

**Behavior**:
- `useLocation` detects hash change
- Hook fires page_view event with full path including hash

**Impact**: Hash changes counted as separate page views

**Alternatives**:
- Filter out hash-only changes (not implemented in MVP)
- May inflate page view metrics slightly

**Decision**: Track all location changes (simpler, acceptable for MVP)

---

### 5. Browser Back/Forward Navigation
**Scenario**: User clicks browser back/forward buttons

**Behavior**:
- React Router updates location (SPA)
- `useLocation` hook detects change
- page_view event fires

**Expected**: Correctly tracked as navigation (desired behavior)

---

### 6. Rapid Route Changes
**Scenario**: User clicks multiple links quickly

**Behavior**:
- Multiple location changes in rapid succession
- Hook fires page_view for each change

**Impact**: Multiple events sent to GA4

**Handling**:
- No client-side debouncing (all events valid)
- GA4 handles rapid events server-side

**Acceptable**: Represents actual user behavior

---

### 7. Server-Side Rendering (SSR)
**Scenario**: N/A (this is a static site)

**Note**: If site migrates to SSR in future:
- gtag.js only loads in browser (client-side)
- Hook uses `useEffect` (client-side only)
- No changes needed (already SSR-compatible)

---

## Success Metrics

### Implementation Success (Immediate)
- ✅ GA4 script tag present in `index.html` with async loading
- ✅ `usePageTracking` hook created with TypeScript types
- ✅ Hook initialized in `App.tsx`
- ✅ Environment variable added to `.env.local.example`
- ✅ Zero TypeScript compilation errors
- ✅ Zero runtime console errors/warnings

### Functional Validation (Day 1)
- ✅ Page views tracked in development environment
- ✅ Production build includes GA4 script with correct ID
- ✅ Events visible in GA4 DebugView in real-time
- ✅ Homepage (`/`) tracked with correct path
- ✅ Blog posts (`/posts/:slug`) tracked with full slug
- ✅ `/editor` route NOT tracked (no events)

### Data Quality (24 hours post-deployment)
- ✅ Page views appearing in GA4 standard reports
- ✅ Traffic sources showing "Direct" for direct visits
- ✅ Bounce rate showing reasonable values (40-70%)
- ✅ Session duration showing reasonable values (30s-5min)
- ✅ No data anomalies or duplicate events

### Performance Validation
- ✅ Lighthouse Performance score not degraded by > 5 points
- ✅ Time to Interactive (TTI) increase < 100ms
- ✅ First Contentful Paint (FCP) unchanged
- ✅ gtag.js script loads asynchronously (non-blocking)

### User Experience
- ✅ Site loads and functions normally with analytics
- ✅ Site loads and functions normally with ad blockers (graceful degradation)
- ✅ No visible UI changes or user-facing impact
- ✅ Navigation feels responsive (no lag)

---

## Out of Scope

❌ **Cookie consent banner** - No GDPR compliance UI (noted as acceptable in spec)
❌ **Custom event tracking** - Only page views (scroll depth, button clicks, etc. deferred)
❌ **E-commerce tracking** - Not applicable to blog/portfolio
❌ **User ID tracking** - No authentication system, anonymous only
❌ **Enhanced measurement configuration** - Use GA4 defaults (file downloads, outbound clicks)
❌ **Server-side tracking** - Client-side only (no server-side GTM)
❌ **Multiple environment IDs** - Single production ID (dev tracking optional)
❌ **Custom dimensions/metrics** - Use GA4 standard dimensions only
❌ **Analytics dashboard UI** - Use GA4 web interface
❌ **Historical data import** - Start fresh from deployment
❌ **A/B testing / Experiments** - Not in initial scope
❌ **Real-time alerts** - No threshold monitoring
❌ **Data export automation** - Manual export from GA4 only

---

## Open Questions

### Q1: Should development environment skip analytics or use separate ID?
**Options**:
1. Skip analytics in dev (`if (import.meta.env.DEV) return;`)
2. Use separate dev/prod measurement IDs
3. Track dev environment with production ID (current approach)

**Recommendation**: Option 3 (simplest, low traffic from dev)
**Rationale**: Dev traffic negligible, not worth added complexity
**Decision**: Use single production ID, track all environments

---

### Q2: Do we want to track hash-only navigation as separate page views?
**Current behavior**: Yes (any `useLocation` change triggers page_view)

**Options**:
1. Track all location changes (current)
2. Filter out hash-only changes
3. Track hash changes with different event name

**Recommendation**: Option 1 (current)
**Defer to**: Post-MVP based on data quality assessment

---

### Q3: Should we add TypeScript types package for gtag?
**Options**:
1. Use `@types/gtag.js` npm package
2. Inline global type declaration (current approach)

**Recommendation**: Option 2 (inline)
**Rationale**: Simpler, no new dependency, sufficient types for our use case
**Decision**: Use inline `declare global` in `usePageTracking.ts`

---

## Next Steps

### Immediate Actions (Before Implementation)
- [ ] Verify GA4 measurement ID: `G-NF9WK1TVFC` is correct
- [ ] Ensure access to Google Analytics 4 dashboard
- [ ] Confirm DebugView is accessible (Admin → DebugView)

### Implementation Sequence
1. **Start with FE-T4** (env config, 5 min)
2. **Proceed to FE-T1** (GA4 script, 15 min)
3. **Implement FE-T2** (hook, 30 min)
4. **Complete FE-T3** (App integration, 10 min)
5. **Test with FE-T5** (dev, 20 min)
6. **Validate with FE-T6** (prod build, 30 min)
7. **Verify with FE-T7** (GA4 DebugView, 30 min)
8. **Document with FE-T8** (optional, 15 min)
9. **Deploy with FE-T9** (10 min + 24hr monitoring)

### Post-Implementation
- [ ] Monitor GA4 dashboard for first 7 days
- [ ] Validate data quality and accuracy
- [ ] Document any issues or optimizations in knowledge base
- [ ] Consider future enhancements (custom events, dashboards)

---

## References

### Official Documentation
- [GA4 Single-Page Applications Guide](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [gtag.js Developer Guide](https://developers.google.com/analytics/devguides/collection/gtagjs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Router useLocation](https://reactrouter.com/en/main/hooks/use-location)

### Project Documentation
- [Spec Document](../specs/20251009-001-spec-google-analytics-setup.md)
- [Idea Document](../ideas/20251009-001-idea-google-analytics-setup.md)

### Related Files
- [index.html](../../index.html) - GA4 script injection point
- [src/presentation/App.tsx](../../src/presentation/App.tsx) - Hook initialization
- [vite.config.ts](../../vite.config.ts) - Build configuration
- [.env.local.example](../../.env.local.example) - Environment template

---

## Implementation Checklist

### Prerequisites
- [ ] GA4 measurement ID confirmed: `G-NF9WK1TVFC`
- [ ] Access to Google Analytics 4 dashboard verified
- [ ] `.env.local` created locally (not committed)

### Code Changes
- [ ] `index.html`: GA4 script tags added
- [ ] `src/hooks/usePageTracking.ts`: Hook created
- [ ] `src/presentation/App.tsx`: Hook initialized
- [ ] `.env.local.example`: GA variable added

### Testing
- [ ] Development build: Analytics works locally
- [ ] Production build: Env var replaced correctly
- [ ] Network tab: gtag.js loads, events sent
- [ ] GA4 DebugView: Events appear in real-time
- [ ] Lighthouse: Performance not degraded

### Deployment
- [ ] Deployment env vars configured (if needed)
- [ ] Production deployed to GitHub Pages
- [ ] Live site: Analytics verified
- [ ] 24-hour monitoring: Data quality validated

### Documentation
- [ ] Setup instructions added to README (optional)
- [ ] Troubleshooting section written (optional)
- [ ] Knowledge base entry created (post-deployment)

---

**Plan Status**: ✅ READY FOR IMPLEMENTATION

**Estimated Total Effort**: 3 hours active development + 24 hours monitoring
**Complexity**: Low (frontend-only, no new dependencies)
**Risk Level**: Low (isolated change, graceful fallbacks)
