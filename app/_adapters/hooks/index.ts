/**
 * React Adapters - Framework-specific wrappers
 *
 * In volatility-based architecture:
 * - This is TIER 1 (VOLATILE) - dump when changing frameworks
 * - All framework-specific code lives here (React, React Query, etc.)
 * - Wraps TIER 3 (stable) use-cases with framework APIs
 *
 * Structure:
 * - Generic wrappers: use-query-wrapper, use-mutation-wrapper
 * - Feature-specific hooks: use-posts, use-editor, etc.
 */

// Generic React Query wrappers (recommended approach)
export { useQueryWrapper } from './use-query-wrapper'
export { useMutationWrapper } from './use-mutation-wrapper'

// Feature-specific hooks (optional - you can also use generic wrappers directly)
export {
  usePosts,
  usePost,
  useDrafts,
  useAllTags,
  usePostsByTag,
  useDeletePost,
} from './use-posts'
