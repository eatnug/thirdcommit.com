# One-page Vibe Site

This is a minimal static scaffold for fast, vibes-first iteration.

## Quick start

- Edit `VIBE_BRIEF.md` to set vibe, CTA, palette, and type.
- Open `index.html` directly in your browser, or serve locally:

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Structure

- `index.html`: Sections skeleton (Hero, Value, Proof, CTA, Footer)
- `styles.css`: Design tokens (palette, spacing, type) and layout
- `script.js`: Tiny interactions (scroll reveal)
- `VIBE_BRIEF.md`: Single source of truth for the vibe

## Notes

- Keep commits tiny. Iterate copy and visuals in loops.
- Swap the palette/type here or in `:root` tokens.
- If you later add a build tool or framework, document choices in `DECISIONS.md`.
