'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { markdownService } from '@/shared/services/markdown.service'
import { useAutosave, useBeforeUnload, useLocalStorage } from '@/presentation/hooks'
import type { AutosaveDraft, EditorVersion } from '@/core/entities/editor.entity'
import { editorStorage } from '@/data/sources/local/editor-storage'
import { generateId, debounce } from '@/shared/utils'

export default function EditorPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Autosave state
  const [lastAutosave, setLastAutosave] = useState<number | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Version history state
  const [versions, setVersions] = useLocalStorage<EditorVersion[]>('editor-versions', [])
  const [showVersions, setShowVersions] = useState(false)

  // Restore autosaved draft on mount
  useEffect(() => {
    const autosave = editorStorage.getAutosave()

    if (autosave) {
      setTitle(autosave.title)
      setDescription(autosave.description)
      setTags(autosave.tags)
      setContent(autosave.content)
      setDraft(autosave.draft)
      setLastAutosave(autosave.timestamp)
      setHasUnsavedChanges(true)
    }
  }, []) // Empty dependency array - only run on mount

  // Track unsaved changes
  useEffect(() => {
    // If any field has content, mark as having unsaved changes
    const hasContent = !!(title || description || tags || content)
    setHasUnsavedChanges(hasContent)
  }, [title, description, tags, content])

  // Autosave callback
  const handleAutosave = (draft: AutosaveDraft) => {
    editorStorage.setAutosave(draft)
    setLastAutosave(Date.now())
  }

  // Set up autosave with custom hook
  useAutosave({
    data: {
      title,
      description,
      tags,
      content,
      draft,
      timestamp: Date.now(),
    },
    onSave: handleAutosave,
    interval: 30000, // 30 seconds
  })

  // Warn before leaving with unsaved changes
  useBeforeUnload(hasUnsavedChanges)

  // Function to save current state as a version
  const saveVersion = () => {
    const newVersion: EditorVersion = {
      id: generateId(),
      title,
      description,
      tags,
      content,
      draft,
      timestamp: Date.now(),
    }

    setVersions((prev) => {
      const updated = [newVersion, ...prev]
      // Keep only last 10 versions
      return updated.slice(0, 10)
    })
  }

  // Function to restore a version
  const restoreVersion = (version: EditorVersion) => {
    setTitle(version.title)
    setDescription(version.description)
    setTags(version.tags)
    setContent(version.content)
    setDraft(version.draft)
    setShowVersions(false)
    setMessage(`✅ Restored version from ${new Date(version.timestamp).toLocaleString()}`)
  }

  // Create debounced preview update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedPreviewUpdate = useCallback(
    debounce((content: string) => {
      if (!content) {
        setPreviewHtml('')
        setPreviewError(null)
        return
      }

      setPreviewLoading(true)
      setPreviewError(null)

      markdownService.toHtml(content)
        .then((html) => {
          setPreviewHtml(html)
          setPreviewLoading(false)
        })
        .catch((error) => {
          console.error('Preview rendering error:', error)
          setPreviewError('Failed to render preview')
          setPreviewLoading(false)
        })
    }, 500), // 500ms debounce
    []
  )

  // Update content change to use debounced update
  useEffect(() => {
    if (showPreview) {
      debouncedPreviewUpdate(content)
    }
  }, [content, showPreview, debouncedPreviewUpdate])

  // Add keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!saving && title && content) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, title, content])

  const handleSave = async () => {
    // Save current state to version history before saving
    saveVersion()

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
        // Clear autosave after successful save
        editorStorage.clearAutosave()
        setHasUnsavedChanges(false)
        setLastAutosave(null)
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
    <div className="container mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Local Post Editor</h1>

        <div className="flex items-center gap-4">
          {/* Version History Dropdown */}
          {versions.length > 0 && (
            <div className="relative">
              <Button
                onClick={() => setShowVersions(!showVersions)}
                variant="outline"
                size="sm"
              >
                History ({versions.length})
              </Button>

              {showVersions && (
                <div className="absolute right-0 top-10 z-10 w-80 rounded-md border border-gray-300 bg-white shadow-lg">
                  <div className="p-2">
                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                      <h3 className="font-medium">Version History</h3>
                      <button
                        onClick={() => setShowVersions(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className="mb-2 rounded border border-gray-200 p-2 hover:bg-gray-50"
                        >
                          <div className="mb-1 flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm truncate">
                                {version.title || '(Untitled)'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(version.timestamp).toLocaleString()}
                              </p>
                              {version.draft && (
                                <span className="text-xs text-orange-600">Draft</span>
                              )}
                            </div>
                            <Button
                              onClick={() => restoreVersion(version)}
                              variant="outline"
                              size="sm"
                              className="ml-2"
                            >
                              Restore
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {version.content.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Autosave indicator */}
          {lastAutosave && (
            <span className="text-xs text-gray-500">
              Autosaved {new Date(lastAutosave).toLocaleTimeString()}
            </span>
          )}

          {/* Preview Toggle */}
          <div className="flex items-center gap-2">
            <label htmlFor="preview-toggle" className="text-sm font-medium">
              Show Preview
            </label>
            <input
              type="checkbox"
              id="preview-toggle"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="h-4 w-4"
              aria-label="Toggle preview panel"
            />
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-1 gap-3">
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

          {/* Tags and Draft in same row */}
          <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
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
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="draft"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="draft" className="text-sm font-medium whitespace-nowrap">
                Save as draft
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Content and Preview Row */}
      <div className={`grid gap-6 flex-1 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Markdown Editor Panel - Dark Theme */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Markdown Source
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-[calc(100vh-28rem)] w-full rounded-lg border-2 border-gray-300 p-4 font-mono text-sm resize-none bg-white text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="# Start writing your markdown here...
## This is the raw markdown editor
- Write markdown syntax
- See live preview on the right"
              style={{
                lineHeight: '1.6',
                tabSize: 2,
              }}
            />
            <div className="absolute top-2 right-2 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {content.split('\n').length} lines
            </div>
          </div>
        </div>

        {/* Preview Panel - Light Theme, Blog Style */}
        {showPreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Rendered Preview
              </label>
              {previewLoading && (
                <span className="text-xs text-gray-500">Rendering...</span>
              )}
            </div>

            <div className="h-[calc(100vh-28rem)] overflow-y-auto rounded-lg border-2 border-gray-300 bg-white p-8">
              {previewError ? (
                <div className="text-red-600 text-sm bg-red-50 p-4 rounded border border-red-200">
                  {previewError}
                </div>
              ) : (
                <>
                  {title && (
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>
                  )}
                  {description && (
                    <p className="text-gray-600 mb-6 text-lg">{description}</p>
                  )}
                  {tags && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {tags.split(',').map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    className="prose prose-lg max-w-none
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
                  {!content && (
                    <p className="text-gray-400 text-center py-16 italic">
                      Start typing to see preview...
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions and Help Row */}
      <div className="mt-4 space-y-4">
        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !title || !content}
            className="px-6"
            aria-label="Save blog post"
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
        <Card className="p-4 bg-gray-50">
          <h3 className="font-medium mb-2">💡 Tips</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Files are saved to <code className="bg-gray-200 px-1 rounded">content/posts/</code></li>
            <li>• Filename is auto-generated from title (lowercase, kebab-case)</li>
            <li>• Drafts won&apos;t appear on the public site</li>
            <li>• Use Markdown syntax for formatting</li>
            <li>• Keyboard shortcut: Cmd/Ctrl + S to save</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
