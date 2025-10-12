import React, { useMemo, useState, useEffect } from 'react'
import { parseToc } from './TableOfContents.utils'
import { useActiveHeading } from './TableOfContents.hooks'

interface TableOfContentsProps {
  htmlContent: string
  postTitle: string
}

const TableOfContentsSkeleton: React.FC = () => {
  return (
    <nav aria-label="Table of Contents" className="sticky top-[20px] w-[250px] max-h-[calc(100vh-40px)] overflow-y-auto p-4">
      <div className="space-y-3 animate-pulse">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        {/* H2 skeletons */}
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="space-y-2 pl-4">
          {/* H3 skeletons */}
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="space-y-2 pl-4">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-10/12"></div>
      </div>
    </nav>
  )
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ htmlContent, postTitle }) => {
  const [isLoading, setIsLoading] = useState(true)

  // Parse ToC structure (memoized to avoid re-parsing on every render)
  const tocItems = useMemo(() => {
    if (!htmlContent) return []
    return parseToc(htmlContent, postTitle)
  }, [htmlContent, postTitle])

  // Show skeleton for a brief moment while parsing
  useEffect(() => {
    if (htmlContent) {
      // Small delay to show skeleton if parsing takes time
      const timer = setTimeout(() => setIsLoading(false), 100)
      return () => clearTimeout(timer)
    }
  }, [htmlContent])

  // Extract all heading IDs for active tracking
  const allHeadingIds = useMemo(() => {
    const ids: string[] = []
    tocItems.forEach((item) => {
      ids.push(item.id)
      if (item.children) {
        item.children.forEach((child) => ids.push(child.id))
      }
    })
    return ids
  }, [tocItems])

  // Track currently visible heading
  const activeHeadingId = useActiveHeading(allHeadingIds)

  // Handle click for smooth scrolling
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()

    const element = document.getElementById(id)
    if (!element) {
      console.warn(`Heading element with id "${id}" not found`)
      return
    }

    // Calculate position to align heading to top 33% of viewport
    // This aligns with natural reading position based on eye-tracking research
    const viewportReadingPosition = window.innerHeight * 0.33
    const elementTop = element.getBoundingClientRect().top
    const offsetPosition = window.pageYOffset + elementTop - viewportReadingPosition

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })

    window.location.hash = id
  }

  // Get link classes based on level and active state
  const getLinkClasses = (level: 0 | 1 | 2 | 3, isActive: boolean) => {
    const baseClasses = 'block transition-all duration-150 ease-in-out focus:outline-none rounded'

    const levelClasses = {
      0: 'text-base font-bold',
      1: 'text-base font-semibold',
      2: 'text-sm font-medium',
      3: 'text-xs font-normal pl-4'
    }[level]

    const stateClasses = isActive
      ? 'text-blue-600 font-bold'
      : level === 0
        ? 'text-gray-800 hover:text-gray-900 hover:underline'
        : level === 1
          ? 'text-gray-700 hover:text-gray-900 hover:underline'
          : level === 2
            ? 'text-gray-600 hover:text-gray-900 hover:underline'
            : 'text-gray-500 hover:text-gray-700 hover:underline'

    return `${baseClasses} ${levelClasses} ${stateClasses}`
  }

  // Show skeleton while loading
  if (isLoading || !htmlContent) {
    return <TableOfContentsSkeleton />
  }

  // Empty state
  if (tocItems.length === 0) {
    return null
  }

  return (
    <nav aria-label="Table of Contents" className="sticky top-[20px] w-[250px] max-h-[calc(100vh-40px)] overflow-y-auto p-4">
      <ol className="list-none space-y-2" role="list">
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={getLinkClasses(item.level, activeHeadingId === item.id)}
              aria-current={activeHeadingId === item.id ? 'location' : undefined}
            >
              {item.text}
            </a>
            {item.children && item.children.length > 0 && (
              <ol className="list-none space-y-1 mt-1" role="list">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      onClick={(e) => handleClick(e, child.id)}
                      className={getLinkClasses(child.level, activeHeadingId === child.id)}
                      aria-current={activeHeadingId === child.id ? 'location' : undefined}
                    >
                      {child.text}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
