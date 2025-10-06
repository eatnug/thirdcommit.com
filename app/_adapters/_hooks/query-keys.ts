export const QUERY_KEYS = {
  POSTS: {
    ALL: ['posts'] as const,
    DETAIL: (slug: string) => ['posts', slug] as const,
    BY_TAG: (tag: string) => ['posts', 'tag', tag] as const,
  },
} as const
