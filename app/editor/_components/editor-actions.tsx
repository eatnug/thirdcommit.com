import { Button } from '@/app/_components/button'
import { Card } from '@/app/_components/card'

interface EditorActionsProps {
  isSaving: boolean
  isPublishing?: boolean
  canSave: boolean
  message: string
  postStatus?: 'draft' | 'published'
  onSave: () => void
  onPublish?: () => void
}

export function EditorActions({
  isSaving,
  isPublishing = false,
  canSave,
  message,
  postStatus = 'draft',
  onSave,
  onPublish,
}: EditorActionsProps) {
  return (
    <div className="mt-4 space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onSave}
          disabled={isSaving || !canSave}
          className="px-6"
          aria-label="Save blog post"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {onPublish && (
          <Button
            onClick={onPublish}
            disabled={isPublishing || postStatus === 'published'}
            variant="outline"
            className="px-6"
            aria-label="Publish post"
          >
            {isPublishing ? 'Publishing...' : postStatus === 'published' ? 'Already Published' : 'Publish'}
          </Button>
        )}

        {message && (
          <p
            className={
              message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
            }
          >
            {message}
          </p>
        )}
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium mb-2">💡 Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • Files are saved to{' '}
            <code className="bg-gray-200 px-1 rounded">content/posts/</code>
          </li>
          <li>
            • Filename is auto-generated from title (lowercase, kebab-case)
          </li>
          <li>• Drafts won&apos;t appear on the public site</li>
          <li>• Use Markdown syntax for formatting</li>
          <li>• Keyboard shortcut: Cmd/Ctrl + S to save</li>
        </ul>
      </Card>
    </div>
  )
}
