import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TypeScript global type declaration for window.gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is available (will be undefined if ad blocker is active)
    if (!window.gtag) {
      return;
    }

    // Exclude /editor route from tracking
    if (location.pathname === '/editor') {
      return;
    }

    // Construct full page path including search and hash
    const pagePath = location.pathname + location.search + location.hash;
    const pageLocation = window.location.href;
    const pageTitle = document.title;

    // Fire page_view event
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_location: pageLocation,
      page_title: pageTitle,
    });
  }, [location]);
}
