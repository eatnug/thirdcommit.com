interface PreviewPanelProps {
  title: string
  description: string
  content: string
  previewHtml: string
  previewLoading: boolean
  previewError: string | null
}

export function PreviewPanel({
  title,
  description,
  content,
  previewHtml,
  previewLoading,
  previewError,
}: PreviewPanelProps) {
  return (
    <div className="relative">
      <div className="min-h-[500px] overflow-y-auto rounded-lg border-2 border-gray-300 bg-gray-100 p-4">
        {previewLoading && (
          <p className="text-sm text-gray-500">Body Preview</p>
        )}
        {previewError ? (
          <div className="text-red-600 text-sm bg-red-50 p-4 rounded border border-red-200">
            {previewError}
          </div>
        ) : (
          <>
            {!content && (
              <p className="text-sm text-gray-500">Body Preview</p>
            )}
            <div
              className="prose prose-lg max-w-none text-[18px]
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-em:text-gray-700 prose-em:italic
                prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-ul:list-disc prose-ol:list-decimal
                prose-li:text-gray-700
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                prose-hr:border-gray-300"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </>
        )}
      </div>
    </div>
  )
}
