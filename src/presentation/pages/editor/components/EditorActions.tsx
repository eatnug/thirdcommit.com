interface EditorActionsProps {
  onSave: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onNew: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  hasChanges: boolean;
  isNewPost: boolean;
  status?: string;
}

export function EditorActions({
  onSave,
  onPublish,
  onDelete,
  onNew,
  isSaving,
  isPublishing,
  hasChanges,
  isNewPost,
  status,
}: EditorActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onNew}
        className="text-[15px] underline"
      >
        New
      </button>

      <button
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className="text-[15px] underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      {!isNewPost && status !== 'published' && (
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="text-[15px] underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? 'Publishing...' : 'Publish'}
        </button>
      )}

      {!isNewPost && (
        <button
          onClick={onDelete}
          className="text-[15px] underline"
        >
          Delete
        </button>
      )}

      {status === 'published' && (
        <span className="text-[15px]">Published</span>
      )}
    </div>
  );
}
