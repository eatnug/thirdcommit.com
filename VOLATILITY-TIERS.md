# Volatility-Based Architecture

## The Three-Tier Model

Frontend code organized by **change frequency** and **replaceability**:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🔴 TIER 1: HIGHLY VOLATILE (Dump When Changing Frameworks)     │
│  ══════════════════════════════════════════════════════════════  │
│                                                                  │
│  Location: app/                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Next.js Routes            app/(routes)/blog/page.tsx      │ │
│  │  React Components          app/_components/ui/button.tsx   │ │
│  │  Framework Adapters        app/_adapters/hooks/            │ │
│  │  UI-Specific Logic         app/editor/_components/         │ │
│  │  Styling (CSS/Tailwind)    app/globals.css                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Change Frequency: Weekly/Monthly                                │
│  Lifespan: Until framework migration (React → Vue)               │
│  Examples: "Migrate to Remix", "Switch to Svelte", "Redesign"   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ↓
                         Depends On
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🟡 TIER 2: MODERATE VOLATILITY (Replace When Swapping Infra)   │
│  ══════════════════════════════════════════════════════════════  │
│                                                                  │
│  Location: src/features/[domain]/infrastructure/                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Repository Implementations                                │ │
│  │  └─ post.filesystem.repository.ts                          │ │
│  │  └─ post.api.repository.ts                                 │ │
│  │  └─ post.cache.repository.ts                               │ │
│  │                                                            │ │
│  │  DTOs & Transformations                                    │ │
│  │  └─ dto/post.dto.ts                                        │ │
│  │                                                            │ │
│  │  External Service Adapters                                 │ │
│  │  └─ services/analytics.service.ts                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Change Frequency: Quarterly/Bi-annually                         │
│  Lifespan: Until infrastructure change                           │
│  Examples: "Filesystem → CMS", "Add caching", "Switch DB"        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ↓
                         Depends On
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🟢 TIER 3: STABLE CORE (Never Dump - Business Logic)           │
│  ══════════════════════════════════════════════════════════════  │
│                                                                  │
│  Location: src/features/[domain]/core/                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Domain Entities           entities/post.entity.ts         │ │
│  │  Business Policies         policies/post-visibility.ts     │ │
│  │  Port Interfaces           ports/post-repository.port.ts   │ │
│  │  Use Cases                 use-cases/get-posts.ts          │ │
│  │  Domain Errors             errors/post-not-found.error.ts  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Change Frequency: Yearly/Multi-year                             │
│  Lifespan: Lifetime of the business domain                       │
│  Examples: "What is a Post?", "Who can see drafts?"              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules

### ✅ Allowed Dependencies

```
TIER 1 (Volatile) → TIER 2 (Moderate) → TIER 3 (Stable)
```

**Examples:**

```typescript
// ✅ TIER 1 depends on TIER 3
// app/blog/page.tsx
import { blog } from '@/features/blog' // Volatile → Stable

// ✅ TIER 2 depends on TIER 3
// src/features/blog/infrastructure/repositories/post.filesystem.repository.ts
import type { IPostRepository } from '@/features/blog/core/ports' // Moderate → Stable

// ✅ TIER 1 depends on TIER 2 (through abstraction)
// app/_adapters/hooks/use-posts.ts
import { blog } from '@/features/blog' // Volatile → (Moderate → Stable)
```

### ❌ Forbidden Dependencies

```
TIER 3 (Stable) ← TIER 2 (Moderate) ← TIER 1 (Volatile)
```

**Examples:**

```typescript
// ❌ TIER 3 depending on TIER 1
// src/features/blog/core/use-cases/get-posts.ts
import { useQuery } from '@tanstack/react-query' // Stable ← Volatile (NEVER!)

// ❌ TIER 3 depending on TIER 2
// src/features/blog/core/use-cases/get-posts.ts
import { FileSystemPostRepository } from '../../infrastructure/repositories' // Stable ← Moderate (NEVER!)

// ❌ TIER 2 depending on TIER 1
// src/features/blog/infrastructure/repositories/post.filesystem.repository.ts
import { Button } from '@/app/_components/ui/button' // Moderate ← Volatile (NEVER!)
```

---

## What Lives in Each Tier?

### 🔴 TIER 1: Highly Volatile

**Dump when:**
- Migrating React → Vue/Svelte
- Switching Next.js → Remix/Vite
- Complete UI redesign
- Changing component library

**Contains:**
- Framework-specific code (React hooks, components)
- UI components (buttons, cards, forms)
- Route definitions (pages, layouts)
- Framework adapters (React Query wrappers)
- Styling (CSS, Tailwind classes)

**Example file:**
```typescript
// app/(routes)/blog/page.tsx
'use client'
import { blog } from '@/features/blog'

export default function BlogPage() {
  const posts = await blog.getPosts()
  return <div className="grid">{/* React UI */}</div>
}
```

---

### 🟡 TIER 2: Moderate Volatility

**Replace when:**
- Switching data sources (filesystem → CMS → API)
- Changing databases (Postgres → MongoDB)
- Adding caching layer
- Swapping external services

**Contains:**
- Repository implementations (filesystem, API, cache)
- Data transformation logic (DTOs)
- External service wrappers (analytics, email)
- Infrastructure configuration

**Example file:**
```typescript
// src/features/blog/infrastructure/repositories/post.filesystem.repository.ts
export class FileSystemPostRepository implements IPostRepository {
  async getPosts(): Promise<Post[]> {
    const fs = await import('fs')
    // Read from filesystem, transform to domain entities
  }
}
```

---

### 🟢 TIER 3: Stable Core

**Never dump** (this is your business)

**Survives:**
- Framework migrations
- Infrastructure changes
- Technology stack overhauls
- Complete rewrites

**Contains:**
- Business rules and policies
- Domain entities (what is a Post?)
- Port interfaces (contracts)
- Use cases (business operations)
- Domain-specific errors

**Example file:**
```typescript
// src/features/blog/core/policies/post-visibility.policy.ts
export class PostVisibilityPolicy {
  static shouldShowInList(post: Post, environment: string): boolean {
    // Business rule: drafts only visible in development
    return environment === 'production' ? !post.draft : true
  }
}
```

---

## Benefits of Volatility-Based Architecture

### 🎯 **Clear Boundaries**
Know exactly what to throw away during migrations

### 🧪 **Targeted Testing**
- TIER 3: Unit tests (business logic)
- TIER 2: Integration tests (adapters)
- TIER 1: E2E tests (UI flows)

### 🚀 **Migration Confidence**
Replace TIER 1 without touching business logic

### 📊 **Technical Debt Visibility**
Changes in TIER 3 = high cost (business logic)
Changes in TIER 1 = low cost (UI tweaks)

### 🔄 **Refactoring Strategy**
Move volatile code down the tiers for stability

---

## Real-World Scenarios

### Scenario 1: Migrate React to Vue

**What changes:**
```
🔴 TIER 1: Complete rewrite (app/)
  ├─ React components → Vue components
  ├─ React hooks → Vue composables
  └─ Next.js routes → Nuxt pages
```

**What stays the same:**
```
🟢 TIER 3: Zero changes (src/features/*/core/)
  ├─ Business policies
  ├─ Use cases
  └─ Domain entities

🟡 TIER 2: Zero changes (src/features/*/infrastructure/)
  ├─ Repositories
  └─ DTOs
```

**Estimated effort:** 40% of codebase

---

### Scenario 2: Switch from Filesystem to Headless CMS

**What changes:**
```
🟡 TIER 2: Replace adapter (infrastructure/)
  ├─ post.filesystem.repository.ts → post.contentful.repository.ts
  └─ Update repository provider
```

**What stays the same:**
```
🟢 TIER 3: Zero changes (core/)
  ├─ Use cases still call IPostRepository
  └─ Business policies unchanged

🔴 TIER 1: Zero changes (app/)
  ├─ UI components unchanged
  └─ Still calls blog.getPosts()
```

**Estimated effort:** 5% of codebase

---

### Scenario 3: Add Draft Approval Workflow

**What changes:**
```
🟢 TIER 3: Add business logic (core/)
  ├─ policies/draft-approval.policy.ts (NEW)
  ├─ use-cases/approve-draft.use-case.ts (NEW)
  └─ entities/post.entity.ts (add approvalStatus field)

🟡 TIER 2: Update adapter (infrastructure/)
  └─ repositories/post.*.repository.ts (add approvePost method)

🔴 TIER 1: Add UI (app/)
  └─ editor/_components/approval-button.tsx (NEW)
```

**Estimated effort:** 15% of codebase (touches all tiers)

---

## Quick Reference

| Tier | Location | Change Frequency | Examples |
|------|----------|------------------|----------|
| 🔴 **TIER 1** | `app/` | Weekly/Monthly | React, Next.js, UI components |
| 🟡 **TIER 2** | `src/features/*/infrastructure/` | Quarterly | Repos, DTOs, services |
| 🟢 **TIER 3** | `src/features/*/core/` | Yearly | Entities, policies, use-cases |

---

## Migration Checklist

When refactoring code, ask:

- [ ] **Is this business logic?** → Move to TIER 3 (core/)
- [ ] **Does this depend on React/Next.js?** → Keep in TIER 1 (app/)
- [ ] **Does this access external systems?** → Move to TIER 2 (infrastructure/)
- [ ] **Will this change if I switch frameworks?** → Yes = TIER 1, No = TIER 3
- [ ] **Is this a reusable business rule?** → Extract to TIER 3 policy
