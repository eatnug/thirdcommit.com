# 20251009-001-SPEC: Google Analytics 4 Setup

**Created**: 2025-10-09
**Status**: SPEC
**Based on**: `docs/ideas/20251009-001-idea-google-analytics-setup.md`

## Feature Description

Implement Google Analytics 4 (GA4) tracking for thirdcommit.com to collect basic visitor analytics including page views and traffic sources. The implementation will use gtag.js script tag with custom React Router integration to properly track client-side navigation in the single-page application.

**Why**: Enable data-driven insights about blog readership and portfolio visitors to inform content strategy and understand audience reach.

## Acceptance Criteria

### Functional Requirements

**AC1: GA4 Script Integration**
- [ ] GA4 gtag.js script tag added to `index.html` `<head>` section
- [ ] Script uses measurement ID from environment variable `VITE_GA_MEASUREMENT_ID`
- [ ] Script loads asynchronously without blocking page render
- [ ] Initial page_view event fires on site load
- [ ] Script is included in generated static HTML files

**AC2: Environment Configuration**
- [ ] `VITE_GA_MEASUREMENT_ID` added to `.env.local.example`
- [ ] Environment variable properly consumed in `index.html` during build
- [ ] Production builds use real GA4 measurement ID
- [ ] Development builds either skip GA or use dev/test measurement ID
- [ ] Missing environment variable fails gracefully (no script injection)

**AC3: SPA Route Change Tracking**
- [ ] Custom `usePageTracking` hook created for route change detection
- [ ] Hook uses React Router's `useLocation` to detect navigation
- [ ] Hook fires `page_view` event on route changes
- [ ] `page_view` includes `page_path`, `page_location`, and `page_title`
- [ ] Hook initialized in `App.tsx` component
- [ ] Only one `page_view` event fires per navigation (no duplicates)

**AC4: Page View Data Quality**
- [ ] Homepage (`/`) tracked with correct path
- [ ] Blog post pages (`/posts/:slug`) tracked with full slug
- [ ] Editor page (`/editor`) NOT tracked (excluded from analytics)
- [ ] Page titles accurately reflect current page content
- [ ] URL parameters and hash fragments preserved in tracking

**AC5: Traffic Source Tracking**
- [ ] Referrer information automatically captured by GA4
- [ ] UTM parameters (utm_source, utm_medium, utm_campaign) tracked
- [ ] Direct traffic identified correctly
- [ ] External link clicks from other sites tracked as referrals

### Non-Functional Requirements

**Performance**:
- [ ] GA4 script does not block initial page render (async loading)
- [ ] Script size < 50KB (gtag.js baseline)
- [ ] Time to Interactive (TTI) not degraded by > 100ms
- [ ] Route change tracking adds < 10ms overhead per navigation

**Developer Experience**:
- [ ] Clear TypeScript types for gtag function
- [ ] Hook is reusable and testable
- [ ] Environment variable setup documented in README
- [ ] No console warnings or errors in development

**Data Privacy**:
- [ ] No Personally Identifiable Information (PII) sent to GA4
- [ ] IP anonymization enabled (GA4 default)
- [ ] Analytics script follows user's Do Not Track settings (optional)

**Build Process Compatibility**:
- [ ] Vite build successfully injects environment variable
- [ ] Puppeteer static HTML generation includes GA4 script
- [ ] Generated HTML files have script in `<head>` before React mount
- [ ] GitHub Pages deployment includes functional analytics

## Technical Requirements

### Architecture

**Client-side tracking approach**:
- gtag.js Global Site Tag (official Google library)
- React custom hook for SPA route tracking
- Environment-based configuration (no runtime API calls)

**Integration Points**:
1. `index.html` - GA4 script tag injection
2. `src/hooks/usePageTracking.ts` - Custom tracking hook
3. `src/presentation/App.tsx` - Hook initialization
4. `vite.config.ts` - Environment variable replacement (if needed)

### Implementation Details

**index.html Script Injection**:
```html
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=%VITE_GA_MEASUREMENT_ID%"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '%VITE_GA_MEASUREMENT_ID%', {
      send_page_view: false // Disable automatic page views for SPA
    });
  </script>
</head>
```

**Custom React Hook** (`src/hooks/usePageTracking.ts`):
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag) return;

    // Don't track editor page
    if (location.pathname === '/editor') return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search + location.hash,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
}
```

**App Integration** (`src/presentation/App.tsx`):
```typescript
import { usePageTracking } from '@/hooks/usePageTracking';

export function App() {
  usePageTracking(); // Initialize tracking

  return (
    <Routes>
      {/* existing routes */}
    </Routes>
  );
}
```

**Environment Variable Configuration**:

`.env.local.example`:
```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

`.env.local` (created by developer):
```bash
VITE_GA_MEASUREMENT_ID="G-NF9WK1TVFC"
```

**Vite HTML Transform Plugin** (if needed for env var replacement):
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Use Vite's built-in HTML env replacement
  // %VITE_GA_MEASUREMENT_ID% automatically replaced
});
```

### File Changes

**New Files**:
- `src/hooks/usePageTracking.ts` - SPA route tracking hook

**Modified Files**:
- [index.html](index.html) - Add GA4 script tags
- [src/presentation/App.tsx](src/presentation/App.tsx) - Initialize tracking hook
- [.env.local.example](.env.local.example) - Add GA measurement ID template

**No Changes**:
- Build scripts (Vite handles env vars automatically)
- Package.json (no new dependencies)

## Best Practices Applied

### From Research

**GA4 SPA Tracking Best Practices**:
- ✅ Disable automatic `page_view` (`send_page_view: false`) to prevent duplicates
- ✅ Use React Router `useLocation` hook for route change detection
- ✅ Send manual `page_view` events with full URL context
- ✅ Include `page_path`, `page_location`, and `page_title` in events
- ✅ Developer-assisted dataLayer push for most reliable tracking

**Performance Optimization**:
- ✅ Load gtag.js asynchronously (`async` attribute)
- ✅ Place script in `<head>` for early initialization
- ✅ Works with SSG/static HTML generation (no server-side dependency)

**Static Site Generation Compatibility**:
- ✅ Client-side tracking compatible with pre-rendered HTML
- ✅ Script injected at build time, executes at runtime
- ✅ No server-side rendering complexity

### From Codebase Patterns

**React Hooks Pattern**:
- Follow existing hooks structure (e.g., query hooks in codebase)
- TypeScript-first implementation
- Single responsibility (tracking only)

**Environment Variables**:
- Use Vite's `VITE_` prefix convention
- Document in `.env.local.example`
- Fail gracefully if missing

## Edge Cases & Constraints

### Edge Cases

**1. Missing Measurement ID**
- **Scenario**: `VITE_GA_MEASUREMENT_ID` not set or empty
- **Behavior**: HTML template shows `%VITE_GA_MEASUREMENT_ID%` literal
- **Solution**: Add build-time validation to warn if env var missing
- **Acceptable**: Site works without analytics, no errors

**2. Ad Blockers / Privacy Extensions**
- **Scenario**: User has ad blocker or privacy extension blocking GA4
- **Behavior**: `window.gtag` is undefined or blocked
- **Solution**: Hook checks `if (!window.gtag) return;` before calling
- **Impact**: Silent failure, site functions normally

**3. Development Environment Tracking**
- **Scenario**: Developers don't want local testing tracked
- **Behavior**: Currently tracks all environments equally
- **Solution**: Conditional script injection based on `import.meta.env.DEV`
- **Alternative**: Use separate dev/prod measurement IDs

**4. Static HTML Generation Timing**
- **Scenario**: Puppeteer pre-renders pages before GA4 loads
- **Behavior**: Static HTML has script tag but no runtime events
- **Impact**: Only runtime page views tracked (acceptable)
- **Not an issue**: GA4 is client-side only

**5. Browser History Navigation (Back/Forward)**
- **Scenario**: User clicks browser back/forward buttons
- **Behavior**: React Router updates location, hook fires
- **Expected**: Tracked as page_view (correct behavior)

**6. Hash-only Navigation**
- **Scenario**: Navigation to `/#section` on same page
- **Behavior**: `useLocation` detects hash change, fires page_view
- **Decision**: Track as separate view (may inflate metrics slightly)
- **Alternative**: Filter out hash-only changes (not implemented in MVP)

**7. Rapid Route Changes**
- **Scenario**: User navigates quickly between pages
- **Behavior**: Multiple page_view events fired in sequence
- **Impact**: All events sent (GA4 handles deduplication server-side)
- **Acceptable**: No client-side debouncing needed

### Failure Scenarios

**GA4 Script Load Failure**:
- Network error loading gtag.js
- → `window.gtag` remains undefined
- → Hook silently skips tracking
- → Site functions normally

**Invalid Measurement ID**:
- Typo or wrong ID in environment variable
- → Events sent to wrong GA4 property or dropped
- → No client-side error
- → Verify in GA4 DebugView

**React Router Not Available**:
- `useLocation` called outside `<BrowserRouter>`
- → React error thrown
- → Prevented by correct initialization in `App.tsx`

**TypeScript Compilation Error**:
- Missing `window.gtag` type declaration
- → Build fails with type error
- → Fixed by global type declaration in hook file

### Data Consistency

**Page View Accuracy**:
- Initial page load: 1 event (from gtag config)
- Each route change: 1 event (from hook)
- No duplicate events (automatic tracking disabled)

**Timing Considerations**:
- GA4 script loads asynchronously
- First route change might fire before gtag ready
- → Hook checks `if (!window.gtag)` to handle gracefully

## Success Metrics

**Implementation Success**:
- ✅ GA4 script tag present in built HTML files
- ✅ Zero TypeScript/build errors
- ✅ Zero runtime console errors or warnings
- ✅ Hook correctly fires on route changes in browser DevTools

**Data Validation** (within 24 hours of deployment):
- ✅ Page views appearing in GA4 DebugView (realtime)
- ✅ Homepage (`/`) and blog post pages (`/posts/*`) both tracked
- ✅ Traffic sources showing "Direct" for direct visits
- ✅ Bounce rate and session duration showing reasonable values

**Performance Validation**:
- ✅ Lighthouse Performance score not degraded by > 5 points
- ✅ Time to Interactive (TTI) increase < 100ms
- ✅ First Contentful Paint (FCP) unchanged

## Out of Scope

❌ **Cookie consent banner** - No GDPR compliance UI (noted as acceptable)
❌ **Custom event tracking** - Only page views (scroll depth, clicks, etc. later)
❌ **E-commerce tracking** - Not applicable to blog/portfolio
❌ **User ID tracking** - No authentication system
❌ **Enhanced measurement toggles** - Use GA4 defaults (file downloads, outbound clicks)
❌ **Server-side tracking** - Client-side only (no GTM server container)
❌ **Multiple environments** - Single production measurement ID (dev tracking optional)
❌ **Analytics dashboard** - Use GA4 web interface only
❌ **Historical data import** - Start tracking from deployment date
❌ **A/B testing / Experiments** - Not in initial scope
❌ **Real-time alerts** - No GA4 threshold monitoring

## Open Questions

- [ ] **Q**: Should development environment skip analytics or use separate ID?
  - **Recommendation**: Use conditional rendering to skip in dev (`import.meta.env.DEV`)
  - **Defer to**: Implementation phase

- [ ] **Q**: Do we want to track hash-only navigation as separate page views?
  - **Current behavior**: Yes (any location change = page_view)
  - **Alternative**: Filter out hash-only changes
  - **Defer to**: Post-MVP based on data quality

- [ ] **Q**: Should we add TypeScript types package for gtag?
  - **Options**: Use `@types/gtag.js` or inline declarations
  - **Recommendation**: Inline (simpler, no new dependency)
  - **Decision**: Inline declaration in hook file

## Implementation Checklist

### Prerequisites
- [ ] Obtain GA4 measurement ID from Google Analytics console
- [ ] Create `.env.local` with `VITE_GA_MEASUREMENT_ID`

### Development Tasks
- [ ] Add GA4 script tags to `index.html`
- [ ] Create `src/hooks/usePageTracking.ts` with TypeScript types
- [ ] Initialize hook in `src/presentation/App.tsx`
- [ ] Update `.env.local.example` with GA variable template
- [ ] Test in development: verify events in browser DevTools

### Testing Tasks
- [ ] Build production bundle: `npm run build`
- [ ] Verify env var replacement in `dist/index.html`
- [ ] Serve production build: `npm run preview`
- [ ] Test route navigation and verify page_view events
- [ ] Check Network tab for gtag.js load and analytics requests
- [ ] Validate events in GA4 DebugView (Realtime)

### Deployment Tasks
- [ ] Set `VITE_GA_MEASUREMENT_ID` in GitHub Actions secrets (if needed)
- [ ] Deploy to GitHub Pages: `npm run deploy`
- [ ] Verify analytics tracking on live site
- [ ] Monitor GA4 dashboard for 24 hours

### Documentation Tasks
- [ ] Document setup steps in README (optional)
- [ ] Create KB entry with learnings (post-deployment)

## Next Steps

1. **Create Google Analytics 4 Property**:
   - Sign in to Google Analytics
   - Create new GA4 property for thirdcommit.com
   - Obtain measurement ID (format: `G-XXXXXXXXXX`)

2. **Begin Implementation**:
   - Proceed to PLAN phase for detailed task breakdown
   - Estimated development time: 1-2 hours
   - Estimated testing time: 30 minutes

3. **Post-Deployment**:
   - Monitor GA4 dashboard for first 7 days
   - Validate data quality and accuracy
   - Document any issues or optimizations in KB

## References

**Official Documentation**:
- [GA4 Single-Page Applications Guide](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)
- [gtag.js Developer Guide](https://developers.google.com/analytics/devguides/collection/gtagjs)

**Research Summary**:
- React SPA tracking requires manual page_view events
- Developer-assisted dataLayer push is most reliable method
- Disable automatic page views to prevent duplicates
- Use router hooks (useLocation) for navigation detection
