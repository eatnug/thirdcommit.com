import Link from 'next/link'
import { getAllTags, getPostsByTag } from '@/lib/posts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TagsPage() {
  const tags = await getAllTags()
  const tagCounts = await Promise.all(
    tags.map(async tag => ({
      tag,
      count: (await getPostsByTag(tag)).length
    }))
  )

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">All Tags</h1>

      <Card>
        <CardHeader>
          <CardTitle>Browse by Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {tagCounts.map(({ tag, count }) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge
                  variant="secondary"
                  className="text-base px-4 py-2 hover:bg-secondary/80"
                >
                  {tag} ({count})
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}