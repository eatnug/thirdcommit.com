import Link from 'next/link'
import { getAllTagsUseCase } from '@/features/blog/core/use-cases/get-all-tags.use-case'
import { getPostsByTagUseCase } from '@/features/blog/core/use-cases/get-posts-by-tag.use-case'
import { Badge } from '@/app/_lib/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_lib/components/ui/card'

export default async function TagsPage() {
  const tags = await getAllTagsUseCase()
  const tagCounts = await Promise.all(
    tags.map(async tag => ({
      tag,
      count: (await getPostsByTagUseCase(tag)).length
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