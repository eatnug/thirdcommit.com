'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/app/_lib/components/ui/button'
import { Card } from '@/app/_lib/components/ui/card'
import { useEditorState } from '@/features/editor/hooks/use-editor-state'
import { savePostUseCase } from '@/features/blog/core/use-cases/save-post.use-case'
import { renderMarkdownUseCase } from '@/features/editor/core/use-cases/render-markdown.use-case'
import { debounce } from '@/shared/utils'

export default function EditorPage() {
  const {
    formData,
    updateFormData,
    lastAutosave,
    clearAutosave,
  } = useEditorState()

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Drafts state
  const [drafts, setDrafts] = useState<Array<{
    slug: string
    title: string
    date: string
    tags: string[]
    description?: string
    contentPreview: string
  }>>([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [currentDraftSlug, setCurrentDraftSlug] = useState<string | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)

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

      renderMarkdownUseCase(content)
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
      debouncedPreviewUpdate(formData.content)
    }
  }, [formData.content, showPreview, debouncedPreviewUpdate])

  // Fetch drafts on mount
  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    setLoadingDrafts(true)
    try {
      console.log('Fetching drafts...')
      const response = await fetch('/api/drafts')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Drafts data:', data)
        setDrafts(data.drafts || [])
      } else {
        console.error('Failed to fetch drafts:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoadingDrafts(false)
    }
  }

  // Add keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!saving && formData.title && formData.content) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, formData.title, formData.content])

  const handleSave = async (asDraft: boolean = false) => {
    setSaving(true)
    setMessage('')

    try {
      const dataToSave = { ...formData, draft: asDraft }
      const result = await savePostUseCase(dataToSave)
      setMessage(`✅ Saved: ${result.filename}`)
      // Clear autosave after successful save
      await clearAutosave()
      // Refresh drafts list
      fetchDrafts()
      // Update form data with the draft status
      updateFormData({ draft: asDraft })
    } catch (error) {
      setMessage(`❌ Failed to save: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const loadDraft = async (slug: string) => {
    try {
      const response = await fetch(`/api/posts/${slug}`)
      if (response.ok) {
        const data = await response.json()
        updateFormData({
          title: data.title,
          description: data.description || '',
          tags: data.tags.join(', '),
          content: data.content,
          draft: data.draft,
        })
        setCurrentDraftSlug(slug)
        setMessage(`✅ Loaded draft: ${data.title}`)
      }
    } catch (error) {
      setMessage(`❌ Failed to load draft: ${error}`)
    }
  }

  const deleteDraft = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete "${slug}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setMessage(`✅ Deleted draft: ${slug}`)
        fetchDrafts()
        if (currentDraftSlug === slug) {
          // Clear editor if we deleted the current draft
          updateFormData({
            title: '',
            description: '',
            tags: '',
            content: '',
            draft: true,
          })
          setCurrentDraftSlug(null)
        }
      }
    } catch (error) {
      setMessage(`❌ Failed to delete draft: ${error}`)
    }
  }

  const startNewDraft = () => {
    updateFormData({
      title: '',
      description: '',
      tags: '',
      content: '',
      draft: true,
    })
    setCurrentDraftSlug(null)
    setMessage('')
  }

  // Show warning in production (using useState to avoid hydration mismatch)
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production')
  }, [])

  if (isProduction) {
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
          {/* Autosave indicator */}
          {lastAutosave && (
            <span className="text-xs text-gray-500">
              Autosaved {new Date(lastAutosave).toLocaleTimeString()}
            </span>
          )}

          {/* Drafts Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowDrafts(!showDrafts)}
              variant="outline"
              size="sm"
            >
              Drafts ({drafts.length})
            </Button>

            {showDrafts && (
              <div className="absolute right-0 top-10 z-10 w-96 rounded-md border border-gray-300 bg-white shadow-lg">
                <div className="p-2">
                  <div className="mb-2 flex items-center justify-between border-b pb-2">
                    <h3 className="font-medium">Drafts</h3>
                    <div className="flex gap-2">
                      <Button onClick={startNewDraft} variant="outline" size="sm">
                        New
                      </Button>
                      <button
                        onClick={() => setShowDrafts(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingDrafts ? (
                      <p className="text-sm text-gray-500 p-2">Loading drafts...</p>
                    ) : drafts.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">No drafts found</p>
                    ) : (
                      drafts.map((draft) => (
                        <div
                          key={draft.slug}
                          className={`mb-2 rounded border p-2 hover:bg-gray-50 cursor-pointer ${
                            currentDraftSlug === draft.slug ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                          }`}
                          onClick={() => {
                            loadDraft(draft.slug)
                            setShowDrafts(false)
                          }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm truncate">{draft.title}</h4>
                              <p className="text-xs text-gray-500">{draft.date}</p>
                              {draft.tags.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {draft.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {draft.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{draft.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteDraft(draft.slug)
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
            )}
          </div>

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
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
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
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="A brief description for SEO (150-160 chars)"
              maxLength={160}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/160 characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => updateFormData({ tags: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="nextjs, react, typescript"
            />
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
              value={formData.content}
              onChange={(e) => updateFormData({ content: e.target.value })}
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
              {formData.content.split('\n').length} lines
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
                  {formData.title && (
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">{formData.title}</h1>
                  )}
                  {formData.description && (
                    <p className="text-gray-600 mb-6 text-lg">{formData.description}</p>
                  )}
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {formData.tags.split(',').map((tag, i) => (
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
                  {!formData.content && (
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
            onClick={() => handleSave(false)}
            disabled={saving || !formData.title || !formData.content}
            className="px-6"
            aria-label="Save blog post"
          >
            {saving ? 'Saving...' : 'Save Post'}
          </Button>

          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !formData.title || !formData.content}
            variant="outline"
            className="px-6"
            aria-label="Save as draft"
          >
            {saving ? 'Saving...' : 'Save Draft'}
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
