import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    const { slug } = await params
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const matter = require('gray-matter')

    const postsDir = path.join(process.cwd(), 'src', 'storage', 'posts')
    const filePath = path.join(postsDir, `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return NextResponse.json({
      slug,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      content,
      draft: data.draft || false,
      date: data.date,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    const { slug } = await params
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')

    const postsDir = path.join(process.cwd(), 'src', 'storage', 'posts')
    const filePath = path.join(postsDir, `${slug}.md`)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    fs.unlinkSync(filePath)

    return NextResponse.json({
      success: true,
      slug,
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post', details: String(error) },
      { status: 500 }
    )
  }
}
