import { useEffect, useState } from 'react';

/**
 * Custom hook to track the currently visible heading using Intersection Observer
 *
 * @param headingIds - Array of heading IDs to observe
 * @returns ID of the topmost visible heading, or null if none visible
 *
 * @example
 * const activeId = useActiveHeading(['heading-0', 'heading-1', 'heading-2'])
 */
export function useActiveHeading(headingIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const updateActiveHeading = () => {
      // Find the last heading that passed the top 33% of viewport
      // Research shows users' eyes focus on 30-40% of viewport when reading
      const viewportReadingPosition = window.innerHeight * 0.33;
      let newActiveId: string | null = null;
      let lastPassedId: string | null = null;

      // Iterate through all headings to find the last one that passed the reading position
      for (const id of headingIds) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If heading is above or at the reading position, it's a candidate
          if (rect.top <= viewportReadingPosition) {
            lastPassedId = id;
          }
        }
      }

      // Use the last heading that passed the reading position
      if (lastPassedId) {
        newActiveId = lastPassedId;
      } else if (headingIds.length > 0) {
        // If no heading has passed the mark, use the first one
        newActiveId = headingIds[0];
      }

      if (newActiveId !== activeId) {
        setActiveId(newActiveId);
      }
    };

    // Initial update
    updateActiveHeading();

    // Add scroll listener with throttle for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headingIds, activeId]);

  return activeId;
}
