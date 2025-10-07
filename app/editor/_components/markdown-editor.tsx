interface MarkdownEditorProps {
  content: string
  contentLineCount: number
  onChange: (content: string) => void
}

export function MarkdownEditor({
  content,
  contentLineCount,
  onChange,
}: MarkdownEditorProps) {
  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[500px] rounded-lg border-2 border-gray-300 p-4 font-mono text-sm resize-none bg-gray-100 text-gray-900 focus:border-gray-400 focus:outline-none transition-all"
        placeholder="Body Input Placeholder"
        style={{
          lineHeight: '1.6',
          tabSize: 2,
        }}
      />
    </div>
  )
}
