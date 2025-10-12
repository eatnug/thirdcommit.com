/**
 * Represents a single item in the Table of Contents
 */
export interface TocItem {
  /** Heading level (0 = title, 1 = h1, 2 = h2, 3 = h3) */
  level: 0 | 1 | 2 | 3

  /** Plain text content of the heading (HTML stripped) */
  text: string

  /** Unique anchor ID (e.g., "heading-0") */
  id: string

  /** Nested child headings (h3 under h2) */
  children?: TocItem[]
}
