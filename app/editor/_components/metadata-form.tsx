interface MetadataFormProps {
  title: string
  description: string
  descriptionCharCount: { current: number; max: number }
  onFieldChange: <K extends 'title' | 'description'>(field: K, value: string) => void
}

export function MetadataForm({
  title,
  description,
  descriptionCharCount,
  onFieldChange,
}: MetadataFormProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="My Awesome Blog Post"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Description (SEO)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="A brief description for SEO (150-160 chars)"
            maxLength={160}
          />
          <p className="mt-1 text-xs text-gray-500">
            {descriptionCharCount.current}/{descriptionCharCount.max} characters
          </p>
        </div>
      </div>
    </div>
  )
}
