import React from 'react';

export const ArticleSkeleton: React.FC = () => {
  return (
    <article
      className="prose prose-lg max-w-[700px] w-full animate-pulse"
      aria-busy="true"
      role="status"
      aria-label="Loading article content"
    >
      {/* Title skeleton - h1 size */}
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>

      {/* Metadata skeleton - date + reading time */}
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>

      {/* Content blocks - varying heights */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>

        {/* Heading placeholder */}
        <div className="h-6 bg-gray-200 rounded w-2/3 mt-6"></div>

        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-10/12"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </article>
  );
};
