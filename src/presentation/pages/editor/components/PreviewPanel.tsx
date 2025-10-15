import { useState, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

interface PreviewPanelProps {
  content: string;
  title: string;
}

export function PreviewPanel({ content, title }: PreviewPanelProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const render = async () => {
      const rawHtml = await marked(content || '');
      setHtmlContent(DOMPurify.sanitize(rawHtml));
    };
    render();
  }, [content]);

  return (
    <div className="w-full bg-[#f5f5f5] px-[18px] py-[13px] h-[809px] overflow-y-auto">
      <article className="prose prose-lg max-w-none">
        {title && (
          <h1 className="text-[25px] font-['Gothic_A1'] mb-4">{title}</h1>
        )}
        <div
          className="text-[15px]"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>
    </div>
  );
}
