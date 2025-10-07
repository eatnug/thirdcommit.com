'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/app/_components/card'
import { useEditorViewModel } from './use-editor-view-model'
import { MetadataForm } from './_components/metadata-form'
import { MarkdownEditor } from './_components/markdown-editor'
import { PreviewPanel } from './_components/preview-panel'
import { DraftsDropdown } from './_components/drafts-dropdown'
import { EditorActions } from './_components/editor-actions'

function EditorContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || undefined
  const vm = useEditorViewModel(id)

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
    <div className="px-4 md:px-[400px] py-[20px]">
      {/* Drafts Dropdown */}
      <div className="relative mb-4">
        <DraftsDropdown
          drafts={vm.drafts}
          loading={vm.loadingDrafts}
          currentPostId={vm.currentPostId}
          isOpen={vm.showDrafts}
          onClose={vm.closeDrafts}
          onLoadDraft={vm.handleLoadDraft}
          onDeleteDraft={vm.handleDeleteDraft}
          onNewDraft={vm.handleNewDraft}
        />
      </div>

      <MetadataForm
        title={vm.formData.title}
        showPreview={vm.showPreview}
        onFieldChange={vm.updateField}
        onTogglePreview={vm.setShowPreview}
        onToggleDrafts={vm.toggleDrafts}
      />

      {/* Content or Preview - Switch between them */}
      <div className="flex-1 mb-4">
        {!vm.showPreview ? (
          <MarkdownEditor
            content={vm.formData.content}
            contentLineCount={vm.contentLineCount}
            onChange={(content) => vm.updateField('content', content)}
          />
        ) : (
          <PreviewPanel
            title={vm.formData.title}
            description={vm.formData.description}
            content={vm.formData.content}
            previewHtml={vm.previewHtml}
            previewLoading={vm.previewLoading}
            previewError={vm.previewError}
          />
        )}
      </div>

      <EditorActions
        isSaving={vm.isSaving}
        isPublishing={vm.isPublishing}
        canSave={vm.canSave}
        message={vm.message}
        postStatus={vm.formData.status}
        description={vm.formData.description}
        onSave={vm.handleSave}
        onPublish={vm.handlePublish}
        onDescriptionChange={(value) => vm.updateField('description', value)}
      />
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorContent />
    </Suspense>
  )
}
