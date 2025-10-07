import { Button } from '@/app/_components/button'

interface EditorActionsProps {
  isSaving: boolean
  isPublishing?: boolean
  canSave: boolean
  message: string
  postStatus?: 'draft' | 'published'
  description: string
  onSave: () => void
  onPublish?: () => void
  onDescriptionChange: (value: string) => void
}

export function EditorActions({
  isSaving,
  isPublishing = false,
  canSave,
  message,
  postStatus = 'draft',
  description,
  onSave,
  onPublish,
  onDescriptionChange,
}: EditorActionsProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
          placeholder="SEO Summary Placeholder"
          maxLength={160}
        />
        <Button
          onClick={onSave}
          disabled={isSaving || !canSave}
          className="px-6 bg-gray-200 text-black hover:bg-gray-300 border-0"
          aria-label="Save blog post"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {onPublish && (
          <Button
            onClick={onPublish}
            disabled={isPublishing || postStatus === 'published'}
            className="px-6 bg-gray-200 text-black hover:bg-gray-300 border-0"
            aria-label="Publish post"
          >
            {isPublishing ? 'Publishing...' : postStatus === 'published' ? 'Published' : 'Publish'}
          </Button>
        )}
      </div>

      {message && (
        <p
          className={`mt-2 ${
            message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
