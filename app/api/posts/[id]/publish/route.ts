import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function generateStaticParams() {
  // Don't generate any static params for API routes in static export
  return []
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

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

    const post = await repository.getPostById(id)
    if (!post) {
      throw new Error('Post not found')
    }

    if (post.status === 'published') {
      throw new Error('Post is already published')
    }

    const now = new Date()
    const publishedPost = await repository.updatePost(id, {
      status: 'published',
      published_at: post.published_at || now,
    })

    return NextResponse.json({
      id: publishedPost.id,
      slug: publishedPost.slug,
      title: publishedPost.title,
      status: publishedPost.status,
      created_at: publishedPost.created_at.toISOString(),
      updated_at: publishedPost.updated_at.toISOString(),
      published_at: publishedPost.published_at?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error publishing post:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('already published')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to publish post', details: String(error) },
      { status: 500 }
    )
  }
}
