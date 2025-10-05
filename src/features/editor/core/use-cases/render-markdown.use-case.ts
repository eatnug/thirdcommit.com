import { markdownService } from '@/shared/services/markdown.service'

export async function renderMarkdownUseCase(content: string): Promise<string> {
  if (!content) return ''
  return await markdownService.toHtml(content)
}
