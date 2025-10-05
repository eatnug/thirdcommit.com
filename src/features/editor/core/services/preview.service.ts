import { renderMarkdownUseCase } from '../use-cases/render-markdown.use-case'
import { debounce } from '@/shared/utils'

export interface PreviewResult {
  html: string
  error: string | null
}

export type PreviewCallback = (result: PreviewResult) => void

export class PreviewService {
  private debouncedRender: (content: string, callback: PreviewCallback) => void

  constructor(debounceMs: number = 500) {
    this.debouncedRender = debounce(
      async (content: string, callback: PreviewCallback) => {
        if (!content) {
          callback({ html: '', error: null })
          return
        }

        try {
          const html = await renderMarkdownUseCase(content)
          callback({ html, error: null })
        } catch (error) {
          console.error('Preview rendering error:', error)
          callback({ html: '', error: 'Failed to render preview' })
        }
      },
      debounceMs
    )
  }

  render(content: string, callback: PreviewCallback): void {
    this.debouncedRender(content, callback)
  }
}

export const previewService = new PreviewService()
