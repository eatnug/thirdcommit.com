import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

interface PostData {
  title: string
  description?: string
  tags: string[]
  content: string
  draft: boolean
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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')

    const postsDir = path.join(process.cwd(), 'src', 'storage', 'posts')

    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filename = `${data.title}.md`
    const filePath = path.join(postsDir, filename)

    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Post with title "${data.title}" already exists` },
        { status: 409 }
      )
    }

    const frontmatter = [
      '---',
      `title: "${data.title}"`,
      data.description ? `description: "${data.description}"` : '',
      `tags: [${data.tags.map(tag => `"${tag}"`).join(', ')}]`,
      `created_at: "${new Date().toISOString()}"`,
      `draft: ${data.draft}`,
      '---',
      '',
      data.content,
    ]
      .filter(Boolean)
      .join('\n')

    fs.writeFileSync(filePath, frontmatter, 'utf8')

    return NextResponse.json(
      {
        success: true,
        filename,
        path: filePath,
        title: data.title,
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
