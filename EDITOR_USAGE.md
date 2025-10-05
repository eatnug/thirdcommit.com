# Local Editor Usage Guide

## Overview

This blog has a **local-only editor** that allows you to write posts in development mode. The editor and API routes are **automatically excluded** from the production build deployed to GitHub Pages.

## Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Open Editor

Navigate to: `http://localhost:3000/editor`

### 3. Write Your Post

Fill in the form:
- **Title** (required): Your post title
- **Description**: SEO meta description (150-160 chars recommended)
- **Tags**: Comma-separated tags (e.g., `nextjs, react, typescript`)
- **Draft**: Check to save as draft (won't appear on public site)
- **Content** (required): Markdown content

### 4. Save Post

Click "Save Post" button. The API route will:
- Generate a slug from the title (lowercase, kebab-case)
- Create frontmatter with date, tags, etc.
- Write a `.md` file to `content/posts/`

Example filename: `my-awesome-post.md`

### 5. Preview Your Post

The post will be available at:
- Development: `http://localhost:3000/posts/my-awesome-post`
- After deployment: `https://thirdcommit.com/posts/my-awesome-post/`

### 6. Commit and Deploy

```bash
git add content/posts/my-awesome-post.md
git commit -m "Add new post: My Awesome Post"
git push
```

GitHub Actions will automatically build and deploy to GitHub Pages.

## File Structure

```
content/posts/
├── hello-world.md
├── getting-started.md
├── code-highlighting.md
└── my-awesome-post.md  # ← Your new post
```

## Frontmatter Format

Generated markdown files include:

```yaml
---
title: "My Awesome Post"
date: "2025-10-04"
tags: ["nextjs", "react"]
description: "A brief description"
draft: false
---

Your markdown content here...
```

## Production Build

When you run `npm run build`, the editor and API routes are **automatically excluded**:

- ✅ Static pages: `out/blog/`, `out/posts/`, `out/tags/`
- ✅ Editor page: `out/editor/` (shows "Editor Not Available" message)
- ❌ API routes: **Not included** in build

This ensures:
- GitHub Pages deployment stays fully static
- No server-side code in production
- Editor only works locally

## Tips

- Use Markdown syntax for formatting (headings, lists, code blocks, etc.)
- Code blocks support syntax highlighting via Shiki
- If a file with the same slug exists, you'll get an error
- Drafts (`draft: true`) are filtered out in production

## Troubleshooting

**"Editor Not Available"**: You're viewing the production build. Use `npm run dev` instead.

**API error**: Make sure you're running the dev server (`npm run dev`).

**File already exists**: Either delete the existing file in `content/posts/` or use a different title.
