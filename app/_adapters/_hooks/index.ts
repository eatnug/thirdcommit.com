/**
 * TIER 1 (Volatile) - Framework Adapters
 *
 * React-specific hooks and React Query wrappers
 * These will be dumped when migrating to a different framework
 */

// React Query wrappers
export { useQueryWrapper } from './use-query-wrapper'
export { useMutationWrapper } from './use-mutation-wrapper'

// Feature-specific hooks (optional)
export { usePosts } from './use-posts'

// UI/utility hooks
export { useLocalStorage } from './use-local-storage'
export { useAutosave } from './use-autosave'
export { useBeforeUnload } from './use-before-unload'
