import { Button } from '@/app/_components/button'
import type { Post } from '@/domain/blog/entities/post.entity'

interface DraftsDropdownProps {
  drafts: Post[]
  loading: boolean
  currentPostId: string | null
  isOpen: boolean
  onClose: () => void
  onLoadDraft: (id: string) => void
  onDeleteDraft: (id: string) => void
  onNewDraft: () => void
}

export function DraftsDropdown({
  drafts,
  loading,
  currentPostId,
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
                key={draft.id}
                className={`mb-2 rounded border p-2 hover:bg-gray-50 cursor-pointer ${
                  currentPostId === draft.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'border-gray-200'
                }`}
                onClick={() => onLoadDraft(draft.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate">
                      {draft.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteDraft(draft.id)
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
