import { notFound } from 'next/navigation'
import { getAllTags, getPostsByTag } from '@/lib/posts'
import { PostCard } from '@/components/blog/post-card'
import { Badge } from '@/components/ui/badge'

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map(tag => ({
    tag,
  }))
}

export default async function TagPage({
  params
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const posts = await getPostsByTag(tag)

  if (posts.length === 0) {
    notFound()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Posts tagged with
        </h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {tag}
        </Badge>
      </div>

      <div className="grid gap-6">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}