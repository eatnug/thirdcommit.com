import type { KeyboardEvent } from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue =
        content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <textarea
      id="markdown"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full bg-[#d9d9d9] px-[18px] py-[13px] h-[809px] text-[20px] font-['Apple_SD_Gothic_Neo'] focus:outline-none resize-none"
      placeholder="Body Input Placeholder"
    />
  );
}
