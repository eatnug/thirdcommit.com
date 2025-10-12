import type { TocItem } from './TableOfContents.types'

/**
 * Parses HTML content to extract Table of Contents structure
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
    // Create temporary DOM element to parse HTML
    const div = document.createElement('div')
    div.innerHTML = htmlContent

    // Query all h1, h2, h3 elements
    const headings = div.querySelectorAll('h1, h2, h3')

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

    let currentH2: TocItem | null = null

    headings.forEach((element) => {
      const id = element.id
      if (!id) {
        console.warn('Heading element missing id attribute:', element.textContent)
        return
      }

      const text = element.textContent?.trim() || ''
      if (!text) {
        return // Skip empty headings
      }

      const level = parseInt(element.tagName[1]) as 1 | 2 | 3

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
    })

    return items
  } catch (error) {
    console.error('Error parsing ToC:', error)
    return []
  }
}
