'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/app/_lib/components/ui/card'
import { useEditorState } from './_hooks/use-editor-state'
import { useDrafts } from './_hooks/use-drafts'
import { usePreview } from './_hooks/use-preview'
import { savePostUseCase } from '@/features/blog/core/use-cases/save-post.use-case'
import { useMutationWrapper } from '@/shared/hooks'
import { EditorHeader } from './_components/editor-header'
import { MetadataForm } from './_components/metadata-form'
import { MarkdownEditor } from './_components/markdown-editor'
import { PreviewPanel } from './_components/preview-panel'
import { DraftsDropdown } from './_components/drafts-dropdown'
import { EditorActions } from './_components/editor-actions'

export default function EditorPage() {
  const {
    formData,
    updateFormData,
    updateField,
    lastAutosave,
    clearAutosave,
    canSave,
    descriptionCharCount,
    contentLineCount,
  } = useEditorState()

  const {
    drafts,
    loading: loadingDrafts,
    currentDraftSlug,
    loadDraft,
    deleteDraft,
    refreshDrafts,
    setCurrentDraftSlug,
  } = useDrafts()

  const [showPreview, setShowPreview] = useState(false)
  const { previewHtml, previewLoading, previewError, updatePreview } =
    usePreview(showPreview)

  const [message, setMessage] = useState('')
  const [showDrafts, setShowDrafts] = useState(false)

  const savePostMutation = useMutationWrapper(savePostUseCase, {
    onSuccess: async (result) => {
      setMessage(`✅ Saved: ${result.filename}`)
      await clearAutosave()
      refreshDrafts()
    },
    onError: (error) => {
      setMessage(`❌ Failed to save: ${error}`)
    },
  })

  // Update preview when content changes
  useEffect(() => {
    updatePreview(formData.content)
  }, [formData.content, updatePreview])

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!savePostMutation.isPending && canSave) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [savePostMutation.isPending, canSave])

  const handleSave = (asDraft: boolean = false) => {
    setMessage('')
    const dataToSave = { ...formData, draft: asDraft }
    savePostMutation.mutate(dataToSave, {
      onSuccess: () => {
        updateFormData({ draft: asDraft })
      },
    })
  }

  const handleLoadDraft = async (slug: string) => {
    try {
      const draftData = await loadDraft(slug)
      if (draftData) {
        updateFormData(draftData)
        setMessage(`✅ Loaded draft: ${draftData.title}`)
      }
      setShowDrafts(false)
    } catch (error) {
      setMessage(`❌ Failed to load draft: ${error}`)
    }
  }

  const handleDeleteDraft = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete "${slug}"?`)) {
      return
    }

    try {
      await deleteDraft(slug)
      setMessage(`✅ Deleted draft: ${slug}`)

      if (currentDraftSlug === slug) {
        handleNewDraft()
      }
    } catch (error) {
      setMessage(`❌ Failed to delete draft: ${error}`)
    }
  }

  const handleNewDraft = () => {
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

  // Show warning in production
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    setIsProduction(process.env.NODE_ENV === 'production')
  }, [])

  if (isProduction) {
    return (
      <div className="container mx-auto max-w-2xl p-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">
            Editor Not Available
          </h1>
          <p className="mt-2 text-gray-600">
            The editor is only available in development mode.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-8">
      <EditorHeader
        lastAutosave={lastAutosave}
        draftsCount={drafts.length}
        showDrafts={showDrafts}
        showPreview={showPreview}
        onToggleDrafts={() => setShowDrafts(!showDrafts)}
        onTogglePreview={setShowPreview}
      />

      {/* Drafts Dropdown */}
      <div className="relative mb-4">
        <DraftsDropdown
          drafts={drafts}
          loading={loadingDrafts}
          currentDraftSlug={currentDraftSlug}
          isOpen={showDrafts}
          onClose={() => setShowDrafts(false)}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          onNewDraft={handleNewDraft}
        />
      </div>

      <MetadataForm
        title={formData.title}
        description={formData.description}
        tags={formData.tags}
        descriptionCharCount={descriptionCharCount}
        onFieldChange={updateField}
      />

      {/* Content and Preview Row */}
      <div
        className={`grid gap-6 flex-1 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        <MarkdownEditor
          content={formData.content}
          contentLineCount={contentLineCount}
          onChange={(content) => updateField('content', content)}
        />

        {showPreview && (
          <PreviewPanel
            title={formData.title}
            description={formData.description}
            tags={formData.tags}
            content={formData.content}
            previewHtml={previewHtml}
            previewLoading={previewLoading}
            previewError={previewError}
          />
        )}
      </div>

      <EditorActions
        isSaving={savePostMutation.isPending}
        canSave={canSave}
        message={message}
        onSave={handleSave}
      />
    </div>
  )
}
