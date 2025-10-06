import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

const isDev = process.env.NODE_ENV === 'development'

interface PostUpdateData {
  title?: string
  description?: string
  content?: string
}

export async function GET(
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
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      published_at: post.published_at?.toISOString() || null,
      description: post.description,
      content: post.content,
      html: post.html,
      readingTime: post.readingTime,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const data: PostUpdateData = await request.json()

    // Import repository directly in API route
    const { getServerPostRepository } = await import('@/infrastructure/blog/repositories/post.repository')
    const repository = await getServerPostRepository()

    // Validate that post exists
    const existingPost = await repository.getPostById(id)
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Update post (preserves status)
    const updatedPost = await repository.updatePost(id, {
      title: data.title,
      description: data.description,
      content: data.content,
    })

    return NextResponse.json({
      id: updatedPost.id,
      slug: updatedPost.slug,
      title: updatedPost.title,
      status: updatedPost.status,
      created_at: updatedPost.created_at.toISOString(),
      updated_at: updatedPost.updated_at.toISOString(),
      published_at: updatedPost.published_at?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error updating post:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to update post', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    // Import fs and path directly for file deletion
    const [fs, path] = await Promise.all([
      import('fs'),
      import('path')
    ])

    const postsDir = path.join(process.cwd(), 'storage/posts')

    // Find file that starts with the ID
    const files = fs.readdirSync(postsDir)
    const matchingFile = files.find(file => file.startsWith(`${id}-`))

    if (!matchingFile) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const filePath = path.join(postsDir, matchingFile)
    fs.unlinkSync(filePath)

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    console.error('Error deleting post:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to delete post', details: String(error) },
      { status: 500 }
    )
  }
}
