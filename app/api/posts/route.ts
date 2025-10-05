import { NextRequest, NextResponse } from 'next/server'

// This file should never be included in static export
// It's only used during local development
const isDev = process.env.NODE_ENV === 'development'

let fs: typeof import('fs')
let path: typeof import('path')

if (isDev) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fs = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  path = require('path')
}

interface PostData {
  title: string
  description?: string
  tags: string[]
  content: string
  draft: boolean
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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

    // Generate filename
    const slug = generateSlug(data.title)
    const date = new Date().toISOString().split('T')[0]
    const filename = `${slug}.md`

    // Create frontmatter
    const frontmatter = `---
title: "${data.title}"
date: "${date}"
tags: ${JSON.stringify(data.tags)}
${data.description ? `description: "${data.description}"` : ''}
draft: ${data.draft}
---

${data.content}
`

    // Write file
    const postsDir = path.join(process.cwd(), 'content', 'posts')

    // Ensure directory exists
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filePath = path.join(postsDir, filename)

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error: `File ${filename} already exists. Please use a different title or delete the existing file.`,
          filename
        },
        { status: 409 }
      )
    }

    fs.writeFileSync(filePath, frontmatter, 'utf-8')

    return NextResponse.json(
      {
        success: true,
        filename,
        path: filePath,
        slug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json(
      { error: 'Failed to save post', details: String(error) },
      { status: 500 }
    )
  }
}
