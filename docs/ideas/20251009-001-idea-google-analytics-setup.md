# 20251009-001: Google Analytics 4 Setup

**Created**: 2025-10-09
**Status**: IDEA

## User Request
I want to analyze visitor data using google analytics. help me set it up

## Current System Overview

**Project**: Personal blog and portfolio (thirdcommit.com)
- **Framework**: Vite + React 19 + TypeScript
- **Routing**: React Router v7 (client-side routing)
- **Deployment**: GitHub Pages (static site generation)
- **Build Process**: Pre-renders all pages to static HTML using Puppeteer

**Business Context**:
- Personal blog by Jake Park (software engineer)
- Features blog posts and project portfolio
- Routes: `/` (homepage), `/posts/:slug` (blog posts), `/editor` (dev only)

**Current Analytics Status**:
- **None implemented** - Zero analytics tracking currently in place
- Found unused Firebase measurement ID in `.env.local.example` (`G-NF9WK1TVFC`)
- No analytics libraries in dependencies

## Related Code

**Integration Points**:
- [index.html](index.html) - Main HTML entry point (lines 1-14)
  - Current: Basic meta tags only
  - Recommended: Add GA4 script tag in `<head>`

- [src/main.tsx](src/main.tsx:1-20) - React application entry point
  - Current: Initializes React, Router, TanStack Query
  - Alternative: Could initialize GA programmatically here

- [src/presentation/App.tsx](src/presentation/App.tsx) - Root component with routing
  - Would need route change tracking using `useLocation()` hook

**Build System**:
- [scripts/generate-static-html.mjs](scripts/generate-static-html.mjs) - Puppeteer pre-rendering
  - GA script will be baked into generated static HTML files

## Related Knowledge Base

No related KB entries found. This will be the first analytics implementation documented.

## Requirements Clarification

**Q**: Do you want to use Google Analytics 4 specifically, or are you open to alternatives?
**A**: GA4

**Q**: What visitor data are you most interested in analyzing?
**A**: Basic page views and traffic sources

**Q**: Do you have any privacy/GDPR requirements?
**A**: Not a concern right now

**Q**: Beyond page views, do you want to track specific interactions?
**A**: Not now

**Q**: How do you prefer to integrate it?
**A**: Whatever is easy to implement and organize

## Initial Scope

- Set up Google Analytics 4 account and get measurement ID
- Add GA4 script tag to `index.html`
- Implement automatic page view tracking for React Router navigation
- Track basic metrics: page views, sessions, traffic sources
- Use environment variable for GA measurement ID

## Out of Scope

- Cookie consent banner
- Custom event tracking (tab switches, link clicks, etc.)
- Privacy/GDPR compliance features
- Advanced analytics (scroll depth, reading time, etc.)
- Demographics or user behavior analysis

## Implementation Approach

**Recommended: Script Tag + Route Tracking Hook**

1. Add GA4 Global Site Tag (gtag.js) to `index.html` `<head>`
2. Use environment variable (`VITE_GA_MEASUREMENT_ID`) for measurement ID
3. Create custom React hook to track route changes
4. Initialize route tracking in `App.tsx`

**Benefits**:
- Easy to implement (no npm dependencies)
- Works with static site generation
- Automatic basic tracking
- Clean separation of concerns

## Next Steps

- [ ] Create Google Analytics 4 property and get measurement ID
- [ ] Add measurement ID to environment variables
- [ ] Add GA4 script tag to `index.html`
- [ ] Create `usePageTracking` hook for route change tracking
- [ ] Initialize tracking in `App.tsx`
- [ ] Test in development and verify events in GA4 dashboard
- [ ] Document setup in KB after completion
