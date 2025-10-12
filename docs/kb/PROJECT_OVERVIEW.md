# thirdcommit.com - Project Overview

**A personal blog and portfolio platform showcasing technical writing and projects**

## What Is This?

thirdcommit.com is a personal website for Jake Park (@eatnug), combining a technical blog with a project portfolio. It's designed as a static site generator that reads markdown posts from the filesystem, converts them to HTML, and deploys to GitHub Pages. The site features both blog posts (primarily in Korean) about career reflections and technical topics, as well as a showcase of notable projects including DoctorNow, The Terminal X, and others.

## Why This Exists

This project serves multiple purposes:
- **Personal expression**: A platform to share career reflections, technical insights, and personal growth stories
- **Technical showcase**: Demonstrates clean architecture principles and modern web development practices
- **Learning laboratory**: A real-world codebase for experimenting with volatility-based hexagonal architecture
- **Portfolio**: Showcases both the projects built and the code that powers the site itself

## Core Business Logic

### What the Application Does

1. **Blog Management**
   - Reads markdown posts from `storage/posts/` directory
   - Parses frontmatter metadata (title, slug, status, dates, description)
   - Filters posts by publication status (draft vs published)
   - Converts markdown to HTML with syntax highlighting
   - Calculates reading time estimates
   - Generates SEO-friendly static HTML pages

2. **Project Showcase**
   - Displays a curated list of notable projects
   - Provides descriptions and external links
   - Supports both completed projects and work-in-progress items

3. **Editor (Development Only)**
   - WYSIWYG markdown editor with live preview
   - Draft management and publishing workflow
   - Metadata editing (title, description)
   - Auto-save functionality with keyboard shortcuts
   - Local storage persistence

4. **Static Site Generation**
   - Pre-renders all pages using Puppeteer
   - Generates individual HTML files for each post
   - Creates JSON data files for posts and projects
   - Optimizes for fast loading and SEO

### Key Business Rules (Domain Policies)

**Post Visibility Policy** ([src/domain/blog/policies/post-visibility.policy.ts](src/domain/blog/policies/post-visibility.policy.ts))
- Published posts appear in public listings
- Draft posts are hidden in production
- Draft posts visible in development environment
- Posts sorted by publication date (newest first)

## Technical Architecture

### Architectural Philosophy

The codebase follows a **volatility-based hexagonal architecture** that organizes code by change frequency rather than traditional technical layers:

- **🔴 TIER 1 (Volatile)**: React components, UI, framework code → Changes when migrating frameworks
- **🟡 TIER 2 (Moderate)**: Infrastructure adapters, repositories → Changes when switching data sources
- **🟢 TIER 3 (Stable)**: Business logic, domain entities, policies → Survives all technology changes

This architecture makes migration paths explicit and protects business logic from framework churn.

### Technology Stack

**Frontend Framework**
- **Vite** (migrated from Next.js) - Fast build tooling and dev server
- **React 19** with React Router - UI framework and routing
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling

**Content Pipeline**
- **gray-matter** - YAML frontmatter parsing
- **marked** - Markdown to HTML conversion
- **shiki** - Syntax highlighting for code blocks
- **reading-time** - Estimates reading duration

**Static Generation**
- **Puppeteer** - Headless browser for pre-rendering
- **Node.js scripts** - Build pipeline orchestration

**Deployment**
- **GitHub Actions** - CI/CD automation
- **GitHub Pages** - Static hosting
- **Custom domain** - thirdcommit.com via CNAME

### Directory Structure

```
thirdcommit.com/
├── src/
│   ├── domain/                    # 🟢 TIER 3: Business Logic (Stable)
│   │   ├── blog/
│   │   │   ├── entities/          # Post, PostFormData models
│   │   │   ├── policies/          # PostVisibilityPolicy (business rules)
│   │   │   ├── ports/             # IPostRepository interface
│   │   │   ├── use-cases/         # getPosts, getPostBySlug, saveDraft, etc.
│   │   │   ├── errors/            # PostNotFoundError
│   │   │   ├── services/          # MarkdownService
│   │   │   └── index.ts           # Public API (barrel export)
│   │   └── projects/
│   │       ├── entities/          # Project model
│   │       ├── ports/             # IProjectRepository interface
│   │       ├── use-cases/         # getProjects
│   │       └── index.ts           # Public API
│   │
│   ├── infrastructure/            # 🟡 TIER 2: Adapters (Moderate)
│   │   ├── blog/
│   │   │   ├── repositories/
│   │   │   │   ├── post.static.repository.ts    # Reads from JSON files
│   │   │   │   ├── post.api.repository.ts       # DEV: API endpoint
│   │   │   │   ├── post.filesystem.repository.ts # Reads markdown files
│   │   │   │   └── post.repository.ts           # IOC container
│   │   │   └── dto/               # Data transformation objects
│   │   └── projects/
│   │       └── repositories/
│   │           ├── project.static.repository.ts # JSON-based
│   │           ├── project.inmemory.repository.ts # Static data
│   │           └── project.repository.ts        # IOC container
│   │
│   ├── presentation/              # 🔴 TIER 1: UI Layer (Volatile)
│   │   ├── pages/
│   │   │   ├── home/              # HomePage with blog/project tabs
│   │   │   ├── post-detail/       # PostDetailPage with markdown rendering
│   │   │   └── editor/            # EditorPage (dev-only)
│   │   ├── layouts/               # Header component
│   │   ├── components/            # Reusable UI (tabs, navigation)
│   │   └── config/                # React Query client
│   │
│   ├── shared/                    # ⚪ Cross-cutting concerns
│   │   └── utils/                 # Framework-agnostic utilities
│   │       ├── cn.ts              # className helper
│   │       ├── debounce.ts        # Debounce utility
│   │       ├── id.ts              # ULID generation
│   │       └── local-storage.ts   # Browser storage wrapper
│   │
│   ├── hooks/                     # React hooks (usePageTracking)
│   └── main.tsx                   # Application entry point
│
├── storage/
│   └── posts/                     # Source markdown files
│       └── *.md                   # Post content with frontmatter
│
├── public/                        # Static assets
│   ├── posts.json                 # Generated: List of published posts
│   ├── post-{slug}.json           # Generated: Individual post data + HTML
│   ├── projects.json              # Generated: Projects list
│   └── CNAME                      # Custom domain configuration
│
├── dist/                          # Build output
│   ├── index.html                 # Pre-rendered homepage
│   └── posts/{slug}/index.html    # Pre-rendered post pages
│
├── scripts/
│   ├── build-static-data.mjs      # Converts markdown → JSON
│   ├── generate-static-html.mjs   # Pre-renders pages with Puppeteer
│   └── dev-api-server.mjs         # Development API server
│
├── docs/
│   ├── kb/                        # Knowledge base
│   │   └── ARCHITECTURE.md        # Detailed architecture guide
│   ├── ideas/                     # Feature proposals
│   ├── plans/                     # Implementation plans
│   └── specs/                     # Technical specifications
│
└── .github/workflows/
    └── deploy.yml                 # GitHub Actions CI/CD
```

## Data Flow

### Production Flow (Static Site)

```
1. Developer writes markdown → storage/posts/foo.md
                                    ↓
2. Build script reads files → build-static-data.mjs
                                    ↓
3. Parses frontmatter + markdown → gray-matter, marked
                                    ↓
4. Generates JSON → public/posts.json, public/post-{slug}.json
                                    ↓
5. Vite builds React app → dist/assets/
                                    ↓
6. Puppeteer pre-renders pages → dist/index.html, dist/posts/{slug}/index.html
                                    ↓
7. GitHub Actions deploys → gh-pages branch → thirdcommit.com
```

### Development Flow (Editor Mode)

```
1. Editor UI → EditorPage component
                    ↓
2. User types markdown → Local state + debounced autosave
                    ↓
3. Save action → savePostUseCase(data, repository)
                    ↓
4. Repository writes → storage/posts/{slug}.md (via API server)
                    ↓
5. Preview panel → Markdown converted to HTML in browser
```

### Request Flow (User visits thirdcommit.com/posts/some-post)

```
1. Browser requests → /posts/some-post
                              ↓
2. GitHub Pages serves → dist/posts/some-post/index.html (pre-rendered)
                              ↓
3. React hydrates → PostDetailPage component
                              ↓
4. Client-side routing → React Router takes over navigation
```

## Key Patterns & Conventions

### 1. Domain-Driven Public API

Each domain (blog, projects) exposes a factory function for dependency injection:

```typescript
// src/domain/blog/index.ts
export function createBlogApi(repository: IPostRepository) {
  return {
    getPosts: () => getPostsUseCase(repository),
    getPost: (slug: string) => getPostBySlugUseCase(slug, repository),
    savePost: (input) => savePostUseCase(input, repository),
    // ...
  }
}

// Usage in components
const blogApi = createBlogApi(getPostRepository());
const posts = await blogApi.getPosts();
```

### 2. Repository Pattern with IOC

Infrastructure layer provides repository implementations:

```typescript
// src/infrastructure/blog/repositories/post.repository.ts
export function getPostRepository(): IPostRepository {
  return new StaticPostRepository(); // Reads from /public/*.json
}

// Can swap implementations without changing domain code:
// - StaticPostRepository (production: JSON files)
// - ApiPostRepository (development: /api endpoints)
// - FileSystemPostRepository (build-time: direct markdown access)
```

### 3. Policy Objects for Business Rules

Business logic encapsulated in reusable policy classes:

```typescript
// src/domain/blog/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInPublicList(post: Post, environment: string): boolean {
    return environment === 'production' ? !post.draft : true;
  }
}
```

### 4. Use Case Functions

Pure business operations as standalone functions:

```typescript
// src/domain/blog/use-cases/get-posts.use-case.ts
export async function getPostsUseCase(
  repository: IPostRepository
): Promise<Post[]> {
  const posts = await repository.getPosts();
  return posts.filter(post => post.status === 'published');
}
```

### 5. Post Metadata Format

All posts use YAML frontmatter:

```yaml
---
id: 01K7A16H23H07KDDD233NEDNVV   # ULID identifier
slug: post-slug-here               # URL-friendly identifier
title: Post Title                  # Display title
description: SEO summary           # Meta description
status: published | draft          # Visibility status
created_at: '2025-10-11T16:20:56.515Z'
updated_at: '2025-10-11T16:20:57.043Z'
published_at: '2025-10-11T16:20:57.043Z'
---

Post content in markdown...
```

## Build & Deployment

### Development Mode

```bash
npm run dev
# Starts two servers:
# - Vite dev server (localhost:3000) - React app
# - API server (localhost:4000) - File system operations
```

- Live reload for instant feedback
- Editor accessible at `/editor`
- Draft posts visible
- API endpoints for saving/deleting posts

### Production Build

```bash
npm run build
# 1. build-static-data.mjs → Generates JSON files
# 2. tsc -b → TypeScript compilation
# 3. vite build → Bundles React app
# 4. generate-html → Pre-renders pages with Puppeteer
```

Output in `dist/`:
- Static HTML files (pre-rendered, SEO-optimized)
- JavaScript bundles (for client-side hydration)
- JSON data files (for dynamic data fetching)
- Assets (CSS, images)

### Deployment Pipeline

**Trigger**: Push to `main` branch

**GitHub Actions** (`.github/workflows/deploy.yml`):
1. Checkout repository
2. Install dependencies
3. Run `npm run deploy`:
   - Builds site
   - Adds `.nojekyll` (disable Jekyll processing)
   - Copies CNAME file
4. Deploy to `gh-pages` branch
5. GitHub Pages serves from `gh-pages`

**Custom Domain**: `thirdcommit.com` (configured via CNAME)

## Environment Configuration

### Build-time Variables

```bash
VITE_GA_MEASUREMENT_ID=G-QPFYXEH933  # Google Analytics tracking
```

### Mode Detection

```typescript
import.meta.env.DEV   // true in development
import.meta.env.PROD  // true in production
```

Used to:
- Show/hide editor routes
- Enable React Query devtools
- Toggle draft post visibility

## Testing Strategy

The architecture supports multiple testing levels:

**Unit Tests** (Domain Layer)
```typescript
// Test business logic in isolation
const mockRepo: IPostRepository = { getPosts: jest.fn() };
const posts = await getPostsUseCase(mockRepo);
```

**Integration Tests** (Infrastructure Layer)
```typescript
// Test repository implementations
const repo = new StaticPostRepository();
const posts = await repo.getPosts();
```

**E2E Tests** (Presentation Layer)
```typescript
// Test user flows
render(<HomePage />);
expect(screen.getByText('Post Title')).toBeInTheDocument();
```

_(Note: Test suites not yet implemented, but architecture designed for testability)_

## Content Strategy

### Current Content

**Blog Posts** (9 published, in Korean)
- "방황을 통과하는 일" series (personal career reflections)
- Topics: Career transitions, self-reflection, personal growth
- Target audience: Korean-speaking developers and professionals

**Projects Showcase**
- DoctorNow (telemedicine app, former employer)
- The Terminal X (AI research agent for finance)
- My Feed (WIP: customizable content aggregator)

### Post Workflow

1. **Draft Creation**
   - Write in editor (`/editor` in dev mode)
   - Auto-saves to `storage/posts/`
   - Status: `draft`

2. **Publish**
   - Click "Publish" button
   - Updates status to `published`
   - Sets `published_at` timestamp

3. **Build**
   - Markdown → HTML conversion
   - JSON generation
   - Static HTML pre-rendering

4. **Deploy**
   - Push to `main` branch
   - GitHub Actions builds & deploys
   - Live on thirdcommit.com

## Migration History

### From Next.js to Vite (October 2025)

**Why**: Simplify architecture, faster builds, remove unnecessary server-side complexity

**Changes**:
- Replaced Next.js App Router → React Router
- Removed server components → Client-side rendering with pre-rendered HTML
- Simplified data fetching → Static JSON + TanStack Query
- Faster dev server startup (Next.js: ~3s → Vite: <1s)

**Migration preserved**:
- Domain logic (zero changes)
- Repository interfaces (zero changes)
- Business rules and policies (zero changes)

This validates the volatility-based architecture: framework changes only affected TIER 1 (presentation layer).

## Known Limitations & Future Work

### Current Limitations

1. **No Backend Database**
   - All content stored as markdown files
   - Editor only works in development mode
   - No remote editing capability

2. **No Search**
   - Cannot search posts by keyword
   - No tagging or categorization

3. **No Comments or Interactions**
   - Static site, no dynamic features
   - No social features

4. **Limited Editor**
   - Basic markdown only
   - No image upload support
   - No collaborative editing

5. **Korean Content Only**
   - No internationalization
   - Single language support

### Potential Enhancements

**Infrastructure Improvements**
- Add full-text search (Algolia or local search index)
- Implement CMS backend (Contentful, Sanity, or custom API)
- Add image upload/optimization pipeline
- RSS feed generation

**Content Features**
- Post tagging and categories
- Related posts suggestions
- Table of contents generation
- Share buttons and SEO optimization

**Editor Enhancements**
- Rich text editing mode
- Image drag-and-drop
- Draft scheduling
- Preview in mobile viewport

**Analytics & Engagement**
- Page view tracking (Google Analytics)
- Read time tracking
- Popular posts widget
- Newsletter signup

## Getting Started for Developers

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/eatnug/thirdcommit.com.git

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Key Commands

```bash
npm run dev          # Start dev servers (Vite + API)
npm run build        # Build for production
npm run deploy       # Build + prepare for GitHub Pages
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Adding a New Post

1. Create markdown file in `storage/posts/{slug}.md`
2. Add YAML frontmatter with required fields
3. Write content in markdown
4. In dev mode: Use editor at `/editor`
5. Commit and push to deploy

### Code Style & Conventions

- **Architecture**: Follow volatility-based layers (TIER 1/2/3)
- **Imports**: Use path aliases (`@/domain`, `@/infrastructure`, `@/presentation`)
- **Dependencies**: Respect dependency direction (outward → inward)
- **Business logic**: Always in domain layer, never in UI
- **TypeScript**: Strict mode, explicit types for public APIs

## Domain Model

### Blog Domain

**Entities**
- `Post`: Published content with metadata
- `PostFormData`: Form input for editor

**Repositories**
- `IPostRepository`: Abstract interface
- `StaticPostRepository`: Reads from JSON files
- `ApiPostRepository`: Calls REST endpoints
- `FileSystemPostRepository`: Direct markdown access

**Use Cases**
- `getPostsUseCase`: Retrieve all published posts
- `getPostBySlugUseCase`: Retrieve single post by slug
- `getDraftsUseCase`: Retrieve all drafts
- `savePostUseCase`: Save draft or update post
- `publishPostUseCase`: Change status to published
- `deletePostUseCase`: Remove post

**Policies**
- `PostVisibilityPolicy`: Business rules for post visibility

### Projects Domain

**Entities**
- `Project`: Portfolio item with title, description, link

**Repositories**
- `IProjectRepository`: Abstract interface
- `StaticProjectRepository`: Reads from JSON
- `InMemoryProjectRepository`: Hardcoded data

**Use Cases**
- `getProjectsUseCase`: Retrieve all projects

## Common Scenarios

### How to Add a Feature

1. **Define domain logic** (TIER 3)
   - Create entity types in `src/domain/{feature}/entities/`
   - Write use cases in `src/domain/{feature}/use-cases/`
   - Add business rules in `src/domain/{feature}/policies/`
   - Define port interface in `src/domain/{feature}/ports/`

2. **Implement infrastructure** (TIER 2)
   - Create repository in `src/infrastructure/{feature}/repositories/`
   - Implement port interface
   - Add to IOC container

3. **Build UI** (TIER 1)
   - Create page component in `src/presentation/pages/{feature}/`
   - Add route in `src/presentation/App.tsx`
   - Use TanStack Query for data fetching

### How to Switch Data Sources

Example: Move from static JSON to CMS API

1. Create new repository: `src/infrastructure/blog/repositories/post.cms.repository.ts`
2. Implement `IPostRepository` interface
3. Update IOC container: `src/infrastructure/blog/repositories/post.repository.ts`
4. No changes needed in domain or presentation layers

### How to Migrate Frameworks

Example: React → Vue

1. Rewrite presentation layer (TIER 1): `src/presentation/`
2. Keep domain layer unchanged (TIER 3): `src/domain/`
3. Keep infrastructure unchanged (TIER 2): `src/infrastructure/`
4. Adapt shared utilities if needed: `src/shared/`

## Troubleshooting

### Build fails with "Module not found"

Check path aliases in:
- `vite.config.ts` (`resolve.alias`)
- `tsconfig.json` (`compilerOptions.paths`)

### Posts not appearing

1. Check post status: Must be `published`
2. Run build script: `npm run build`
3. Verify JSON generated: `public/posts.json`
4. Check PostVisibilityPolicy logic

### Editor not saving

1. Ensure dev mode: `import.meta.env.DEV === true`
2. Check API server running: `http://localhost:4000`
3. Verify file permissions in `storage/posts/`

### Deployment fails

1. Check GitHub Actions logs
2. Verify CNAME file exists
3. Ensure `gh-pages` branch created
4. Check GitHub Pages settings (source: gh-pages branch)

## Resources & References

### Internal Documentation

- [docs/kb/ARCHITECTURE.md](docs/kb/ARCHITECTURE.md) - Detailed architecture guide
- [docs/MIGRATION_COMPLETE.md](docs/MIGRATION_COMPLETE.md) - Next.js → Vite migration notes
- `docs/ideas/` - Feature proposals and ideas
- `docs/specs/` - Technical specifications
- `docs/plans/` - Implementation plans

### External References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture) - Ports & Adapters pattern
- [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) - Architecture philosophy
- [Volatility-Based Decomposition](https://dmitripavlutin.com/frontend-architecture-stable-and-volatile-dependencies/) - Layer organization principle

### Technology Documentation

- [Vite](https://vitejs.dev/) - Build tool
- [React Router](https://reactrouter.com/) - Routing
- [TanStack Query](https://tanstack.com/query) - Server state management
- [GitHub Pages](https://docs.github.com/en/pages) - Hosting

## Contact & Contributing

**Author**: Jake Park (@eatnug)
**Email**: jake@thirdcommit.com
**Website**: https://thirdcommit.com
**Repository**: https://github.com/eatnug/thirdcommit.com

This is a personal project, but feedback and suggestions are welcome!

---

**Last Updated**: October 2025
**Codebase Version**: Post-Vite migration, production-ready
