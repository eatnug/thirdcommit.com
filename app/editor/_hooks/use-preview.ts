import { useState, useCallback } from 'react'
import { previewService, type PreviewCallback } from '@/features/editor/core/services/preview.service'

interface UsePreviewResult {
  previewHtml: string
  previewLoading: boolean
  previewError: string | null
  updatePreview: (content: string) => void
}

export function usePreview(isEnabled: boolean): UsePreviewResult {
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const handlePreviewResult: PreviewCallback = useCallback((result) => {
    setPreviewHtml(result.html)
    setPreviewError(result.error)
    setPreviewLoading(false)
  }, [])

  const updatePreview = useCallback(
    (content: string) => {
      if (!isEnabled) return

      setPreviewLoading(true)
      setPreviewError(null)
      previewService.render(content, handlePreviewResult)
    },
    [isEnabled, handlePreviewResult]
  )

  return {
    previewHtml,
    previewLoading,
    previewError,
    updatePreview,
  }
}
