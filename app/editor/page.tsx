'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function EditorPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          content,
          draft,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Saved: ${data.filename}`)
        // Optionally clear form
        // setTitle('')
        // setDescription('')
        // setTags('')
        // setContent('')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Failed to save: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  // Show warning in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto max-w-2xl p-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Editor Not Available</h1>
          <p className="mt-2 text-gray-600">
            The editor is only available in development mode.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Local Post Editor</h1>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="A brief description for SEO (150-160 chars)"
            maxLength={160}
          />
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/160 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="nextjs, react, typescript"
          />
        </div>

        {/* Draft Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="draft"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="draft" className="text-sm font-medium">
            Save as draft
          </label>
        </div>

        {/* Content */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Content (Markdown) *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-96 w-full rounded-md border border-gray-300 p-3 font-mono text-sm"
            placeholder="Write your post content in Markdown..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !title || !content}
            className="px-6"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </Button>

          {message && (
            <p className={message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
              {message}
            </p>
          )}
        </div>

        {/* Help Text */}
        <Card className="mt-6 p-4 bg-gray-50">
          <h3 className="font-medium mb-2">💡 Tips</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Files are saved to <code className="bg-gray-200 px-1 rounded">content/posts/</code></li>
            <li>• Filename is auto-generated from title (lowercase, kebab-case)</li>
            <li>• Drafts won&apos;t appear on the public site</li>
            <li>• Use Markdown syntax for formatting</li>
            <li>• After saving, commit and push to deploy</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
