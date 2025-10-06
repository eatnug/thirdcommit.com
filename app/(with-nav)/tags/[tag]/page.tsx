import { notFound } from 'next/navigation'
import { getAllTagsUseCase } from '@/features/blog/core/use-cases/get-all-tags.use-case'
import { getPostsByTagUseCase } from '@/features/blog/core/use-cases/get-posts-by-tag.use-case'
import { PostCard } from '@/app/(with-nav)/blog/_components/post-card'
import { Badge } from '@/app/_components/badge'

export async function generateStaticParams() {
  const tags = await getAllTagsUseCase()
  if (tags.length === 0) {
    return [] // Return empty array when no tags exist
  }
  return tags.map(tag => ({
    tag,
  }))
}

export const dynamicParams = false // Disable dynamic params for static export

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
          <PostCard key={post.title} post={post} />
        ))}
      </div>
    </div>
  )
}