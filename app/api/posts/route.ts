import { NextRequest, NextResponse } from 'next/server'
import { postRepository } from '@/features/blog/data/repositories/post.repository'

/**
 * Primary/Driving Adapter for creating posts
 * This is an API route adapter that drives the application through the use case
 *
 * In hexagonal architecture:
 * - This is a PRIMARY ADAPTER (driving the application)
 * - It translates HTTP requests into use case calls
 * - Only available in development mode
 */

const isDev = process.env.NODE_ENV === 'development'

interface PostData {
  title: string
  description?: string
  tags: string[]
  content: string
  draft: boolean
}

export async function POST(request: NextRequest) {
  // Block in production
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    const data: PostData = await request.json()

    // Validation
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Use the repository to create post (goes through the port)
    const result = await postRepository.createPost({
      title: data.title,
      description: data.description,
      tags: data.tags,
      content: data.content,
      draft: data.draft,
    })

    return NextResponse.json(
      {
        success: true,
        filename: result.filename,
        path: result.path,
        slug: result.slug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving post:', error)

    // Handle duplicate file error
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
