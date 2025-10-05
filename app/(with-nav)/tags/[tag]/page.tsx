import { notFound } from 'next/navigation'
import { getAllTagsUseCase } from '@/features/blog/core/use-cases/get-all-tags.use-case'
import { getPostsByTagUseCase } from '@/features/blog/core/use-cases/get-posts-by-tag.use-case'
import { PostCard } from '@/app/(with-nav)/blog/_components/post-card'
import { Badge } from '@/app/_components/badge'

export async function generateStaticParams() {
  const tags = await getAllTagsUseCase()
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
  const posts = await getPostsByTagUseCase(tag)

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