import { NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function GET() {
  if (!isDev) {
    return NextResponse.json(
      { error: 'API routes are only available in development' },
      { status: 404 }
    )
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const matter = require('gray-matter')

    const postsDir = path.join(process.cwd(), 'src', 'storage', 'posts')

    if (!fs.existsSync(postsDir)) {
      return NextResponse.json({ drafts: [] })
    }

    const files = fs.readdirSync(postsDir)
    const drafts = files
      .filter((file: string) => file.endsWith('.md'))
      .map((file: string) => {
        const filePath = path.join(postsDir, file)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data, content } = matter(fileContents)

        if (data.draft) {
          return {
            slug: file.replace(/\.md$/, ''),
            title: data.title,
            date: data.date,
            tags: data.tags || [],
            description: data.description,
            contentPreview: content.substring(0, 100),
          }
        }
        return null
      })
      .filter(Boolean)

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drafts', details: String(error) },
      { status: 500 }
    )
  }
}
