# 20251012-003: Content Skeleton Loader Learnings

**Task**: Implement skeleton loading UI for post detail page to eliminate layout shift
**Completed**: 2025-10-12
**Related**: Implementation for content skeleton loader feature

## Implementation Summary

Implemented a skeleton loading UI for the post detail page that eliminates layout shift (CLS) during content loading. The solution uses React best practices for loading states and maintains visual consistency between loading and loaded states.

Key components modified:
- `src/presentation/components/TableOfContents.tsx:10` - Exported TableOfContentsSkeleton
- `src/presentation/components/ArticleSkeleton.tsx` - New skeleton component
- `src/presentation/pages/post-detail/PostDetailPage.tsx:47-77` - Updated loading state

## Patterns Discovered

### Pattern 1: Layout Preservation with Skeleton Components

**Context**: Need to prevent layout shift when content loads by reserving exact space during loading

**Solution**: Match loading state structure exactly to loaded state structure
```tsx
if (isLoading) {
  return (
    <div className="flex flex-col">
      {/* Same header structure */}
      <div className="md:hidden">
        <Header variant="mobile-simple" />
      </div>

      {/* Same content layout with skeletons */}
      <div className="flex justify-center gap-8 px-5 py-5">
        <div className="hidden xl:block w-[250px] shrink-0" />
        <ArticleSkeleton />
        <aside className="hidden xl:block w-[250px] shrink-0">
          <TableOfContentsSkeleton />
        </aside>
      </div>
    </div>
  );
}
```

**Reusable**: Apply to any page with complex responsive layouts

### Pattern 2: Typography-Aligned Skeleton Dimensions

**Context**: Skeleton element heights must match prose typography for zero layout shift

**Solution**: Map skeleton heights to prose-lg typography sizes
- `h-10` (40px) = h1 in prose-lg
- `h-6` (24px) = h2 in prose-lg
- `h-4` (16px) = paragraph text

### Pattern 3: Export Internal Skeleton for Reuse

**Context**: TableOfContents had internal skeleton, needed externally

**Solution**: Export skeleton component for reuse
```tsx
// Export for external use
export const TableOfContentsSkeleton: React.FC = () => { ... }

// Component still uses internally
if (isLoading || !htmlContent) {
  return <TableOfContentsSkeleton />
}
```

## Key Takeaways

1. **Layout Preservation**: Skeleton must match loaded state structure exactly
2. **Typography Alignment**: Heights must match prose typography sizes
3. **Component Reusability**: Export internal skeletons, place in shared components
4. **Accessibility**: Include ARIA attributes (aria-busy, role, aria-label)
5. **Responsive Consistency**: Use identical breakpoints across states
6. **Visual Realism**: Vary skeleton widths to mimic content flow

## Files Modified

- `src/presentation/components/TableOfContents.tsx` - Exported TableOfContentsSkeleton
- `src/presentation/components/ArticleSkeleton.tsx` - New skeleton component
- `src/presentation/pages/post-detail/PostDetailPage.tsx` - Updated loading state
