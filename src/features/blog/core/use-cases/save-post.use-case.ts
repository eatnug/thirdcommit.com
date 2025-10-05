export interface SavePostInput {
  title: string
  description: string
  tags: string
  content: string
  draft: boolean
}

export async function savePostUseCase(input: SavePostInput) {
  const tagArray = input.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description || undefined,
      tags: tagArray,
      content: input.content,
      draft: input.draft,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save post')
  }

  return await response.json()
}
