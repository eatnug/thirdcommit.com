import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

const isDev = process.env.NODE_ENV === 'development'

export async function GET() {
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    // Import repository directly in API route
    const { getServerPostRepository } = await import('@/infrastructure/blog/repositories/post.repository')
    const repository = await getServerPostRepository()
    const posts = await repository.getPosts()

    // Filter to only draft posts
    const drafts = posts
      .filter((post) => post.status === 'draft')
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      .map((draft) => ({
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        status: draft.status,
        updated_at: draft.updated_at.toISOString(),
        description: draft.description,
      }))

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts', details: String(error) },
      { status: 500 }
    )
  }
}
