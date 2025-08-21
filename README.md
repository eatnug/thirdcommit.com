# thirdcommit.com — personal page

Static, content‑first personal page for Jake Park. Simple two‑column layout built live in Cursor: profile + links on the left, project cards on the right. No build step, just HTML/CSS/JS.

## What this page is

- Left column
  - Circular profile image
  - Inline icons: LinkedIn, Email, Instagram, GitHub
  - Name and one‑paragraph story in a monospace style
- Right column
  - “What should I build next?” mailto card
  - Project cards: My Feed (WIP), Terminal X, DoctorNow
  - Each card has a small thumb (emoji/favicons) + title + one‑liner

## How we built it (process)

1. Brief
   - Wrote a minimal brief in `VIBE_BRIEF.md` to lock scope and tone (blog/brand, not SaaS).
2. Scaffold
   - Created `index.html`, `styles.css`, `script.js` and iterated in small commits.
3. Layout
   - Two‑column CSS grid (`.grid-simple`): sticky left, top‑aligned columns.
   - No header/footer; everything designed to fit a single viewport.
4. Style
   - Design tokens in `:root` (colors, spacing, type).
   - Soft separation via background/spacing; no heavy borders.
   - Inline SVG icons to avoid external blockers; `referrerpolicy` for remote images.
5. Content
   - Left story copy refined to be descriptive and non‑cringe.
   - Right cards linked to real products (Terminal X, DoctorNow) with concise summaries.
6. Hosting
   - Repo pushed to GitHub; Pages via Actions, custom domain with CNAME.

## Run locally

```bash
cd /Users/eatnug/Workspace/thirdcommit.com
python3 -m http.server 5173
# open http://localhost:5173
```

## Files

- `index.html`: markup for the two‑column layout
- `styles.css`: tokens + layout + components (profile, cards, icons)
- `script.js`: small helpers (year stamp, reveal on scroll)
- `VIBE_BRIEF.md`: brief capturing tone/constraints
- `CNAME`: custom domain for GitHub Pages
- `.github/workflows/pages.yml`: deploy workflow

## Deploy (GitHub Pages + Cloudflare)

- Pages: source = GitHub Actions (workflow included)
- Domain: use CNAME flattening at Cloudflare to `eatnug.github.io` for apex and `www`
- Optional: redirect rule `www` → apex; enable Always Use HTTPS

## Notes

- Keep commits small; copy and spacing changes are valid commits.
- Prefer SVG/emoji over external image CDNs for reliability.
- See `cursor_chat_sanitized.md` for the anonymized build log.
