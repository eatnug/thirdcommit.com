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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Markdown Source
      </label>
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="h-[calc(100vh-28rem)] w-full rounded-lg border-2 border-gray-300 p-4 font-mono text-sm resize-none bg-white text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          placeholder="# Start writing your markdown here...
## This is the raw markdown editor
- Write markdown syntax
- See live preview on the right"
          style={{
            lineHeight: '1.6',
            tabSize: 2,
          }}
        />
        <div className="absolute top-2 right-2 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {contentLineCount} lines
        </div>
      </div>
    </div>
  )
}
