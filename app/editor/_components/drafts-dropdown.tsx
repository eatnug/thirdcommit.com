import { Button } from '@/app/_components/button'
import type { Post } from '@/features/blog/core/entities/post.entity'

interface DraftsDropdownProps {
  drafts: Post[]
  loading: boolean
  currentDraftSlug: string | null
  isOpen: boolean
  onClose: () => void
  onLoadDraft: (slug: string) => void
  onDeleteDraft: (slug: string) => void
  onNewDraft: () => void
}

export function DraftsDropdown({
  drafts,
  loading,
  currentDraftSlug,
  isOpen,
  onClose,
  onLoadDraft,
  onDeleteDraft,
  onNewDraft,
}: DraftsDropdownProps) {
  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-10 z-10 w-96 rounded-md border border-gray-300 bg-white shadow-lg">
      <div className="p-2">
        <div className="mb-2 flex items-center justify-between border-b pb-2">
          <h3 className="font-medium">Drafts</h3>
          <div className="flex gap-2">
            <Button onClick={onNewDraft} variant="outline" size="sm">
              New
            </Button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500 p-2">Loading drafts...</p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">No drafts found</p>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.slug}
                className={`mb-2 rounded border p-2 hover:bg-gray-50 cursor-pointer ${
                  currentDraftSlug === draft.slug
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-200'
                }`}
                onClick={() => onLoadDraft(draft.slug)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate">
                      {draft.title}
                    </h4>
                    <p className="text-xs text-gray-500">{draft.date.toString()}</p>
                    {draft.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {draft.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {draft.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{draft.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteDraft(draft.slug)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
