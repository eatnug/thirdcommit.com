import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Navigation() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(import.meta.env.DEV);
  }, []);

  // Determine active tab based on pathname and query string
  const getActiveTab = () => {
    if (location.pathname === '/editor') return 'write';
    if (location.pathname.startsWith('/posts')) return 'blog';
    const tab = searchParams.get('tab');
    if (tab === 'blog') return 'blog';
    if (tab === 'about') return 'about';
    // Default to blog when no query string
    if (location.pathname === '/') return 'blog';
    return 'blog';
  };

  const currentTab = getActiveTab();

  return (
    <nav className="flex items-center gap-[10px]">
      <Link
        to="/?tab=blog"
        className={`px-[5px] py-[8px] text-[20px] font-normal border-b-[3px] outline-none ${
          currentTab === 'blog'
            ? 'border-black'
            : 'border-transparent hover:border-gray-300'
        }`}
      >
        Blog
      </Link>
      <Link
        to="/?tab=about"
        className={`px-[5px] py-[8px] text-[20px] font-normal border-b-[3px] outline-none ${
          currentTab === 'about'
            ? 'border-black'
            : 'border-transparent hover:border-gray-300'
        }`}
      >
        About
      </Link>
      {isDevelopment && (
        <Link
          to="/editor"
          className={`px-[5px] py-[8px] text-[20px] font-normal border-b-[3px] outline-none ${
            currentTab === 'write'
              ? 'border-black'
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          Write
        </Link>
      )}
    </nav>
  );
}
