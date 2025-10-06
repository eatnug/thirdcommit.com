import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

const isDev = process.env.NODE_ENV === 'development'

interface PostData {
  title: string
  description?: string
  content: string
  status?: 'draft' | 'published'
}

export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    const data: PostData = await request.json()

    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Import repository directly in API route
    const { getServerPostRepository } = await import('@/infrastructure/blog/repositories/post.repository')
    const repository = await getServerPostRepository()

    const result = await repository.createPost({
      title: data.title,
      description: data.description,
      content: data.content,
      status: data.status || 'draft',
    })

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        slug: result.slug,
        title: result.title,
        status: result.status,
        filename: result.filename,
        path: result.path,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving post:', error)

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save post', details: String(error) },
      { status: 500 }
    )
  }
}
