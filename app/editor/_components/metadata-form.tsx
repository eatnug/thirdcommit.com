interface MetadataFormProps {
  title: string
  showPreview: boolean
  onFieldChange: <K extends 'title' | 'description'>(field: K, value: string) => void
  onTogglePreview: (checked: boolean) => void
  onToggleDrafts: () => void
}

export function MetadataForm({
  title,
  showPreview,
  onFieldChange,
  onTogglePreview,
  onToggleDrafts,
}: MetadataFormProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
          placeholder="Title Input Placeholder"
        />
        <button
          onClick={onTogglePreview.bind(null, !showPreview)}
          className="p-2 hover:bg-gray-100 rounded"
          title={showPreview ? "Show Editor" : "Show Preview"}
        >
          {showPreview ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2v4h8V8H6z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
          )}
        </button>
        <button
          onClick={onToggleDrafts}
          className="p-2 hover:bg-gray-100 rounded"
          title="Show Drafts"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
