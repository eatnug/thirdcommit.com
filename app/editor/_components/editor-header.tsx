import { Button } from '@/app/_lib/components/ui/button'

interface EditorHeaderProps {
  lastAutosave: number | null
  draftsCount: number
  showDrafts: boolean
  showPreview: boolean
  onToggleDrafts: () => void
  onTogglePreview: (checked: boolean) => void
}

export function EditorHeader({
  lastAutosave,
  draftsCount,
  showPreview,
  onToggleDrafts,
  onTogglePreview,
}: EditorHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold">Local Post Editor</h1>

      <div className="flex items-center gap-4">
        {lastAutosave && (
          <span className="text-xs text-gray-500">
            Autosaved {new Date(lastAutosave).toLocaleTimeString()}
          </span>
        )}

        <Button onClick={onToggleDrafts} variant="outline" size="sm">
          Drafts ({draftsCount})
        </Button>

        <div className="flex items-center gap-2">
          <label htmlFor="preview-toggle" className="text-sm font-medium">
            Show Preview
          </label>
          <input
            type="checkbox"
            id="preview-toggle"
            checked={showPreview}
            onChange={(e) => onTogglePreview(e.target.checked)}
            className="h-4 w-4"
            aria-label="Toggle preview panel"
          />
        </div>
      </div>
    </div>
  )
}
