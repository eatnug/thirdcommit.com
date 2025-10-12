import type { TocItem } from './TableOfContents.types'

/**
 * Parses HTML content to extract Table of Contents structure using regex (faster than DOM parsing)
 *
 * @param htmlContent - HTML string containing heading elements
 * @param postTitle - Title of the post to add as first item
 * @returns Array of ToC items with nested structure
 *
 * @example
 * const toc = parseToc('<h1 id="heading-0">Title</h1>', 'Post Title')
 * // Returns: [{ level: 0, text: 'Post Title', id: 'title', children: [] }, ...]
 */
export function parseToc(htmlContent: string, postTitle: string): TocItem[] {
  try {
    const items: TocItem[] = []

    // Add post title as first item
    if (postTitle) {
      items.push({
        level: 0 as any,
        text: postTitle,
        id: 'title',
        children: []
      })
    }

    // Regex to match heading tags: <h1 id="heading-0">Text</h1>
    // This is much faster than creating a DOM element and using innerHTML
    const headingRegex = /<h([1-3])\s+id="([^"]+)">([^<]+)<\/h\1>/gi
    let match: RegExpExecArray | null

    let currentH2: TocItem | null = null

    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1]) as 1 | 2 | 3
      const id = match[2]
      const text = match[3].trim()

      if (!text || !id) continue

      const item: TocItem = {
        level,
        text,
        id,
        children: []
      }

      if (level === 1 || level === 2) {
        // Top-level items
        items.push(item)
        if (level === 2) {
          currentH2 = item
        } else {
          currentH2 = null
        }
      } else if (level === 3 && currentH2) {
        // Nest h3 under parent h2
        currentH2.children?.push(item)
      } else if (level === 3) {
        // h3 without parent h2, add as top-level
        items.push(item)
      }
    }

    return items
  } catch (error) {
    console.error('Error parsing ToC:', error)
    return []
  }
}
