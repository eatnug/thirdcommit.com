import { notFound } from 'next/navigation'
import { blog } from '@/domain/blog'
import { PostCard } from '@/app/(with-nav)/blog/_components/post-card'
import { Badge } from '@/app/_components/badge'

export async function generateStaticParams() {
  const tags = await blog.getAllTags()
  // Return at least one dummy param for static export, even if no tags exist
  // The actual page will handle the notFound() case
  if (tags.length === 0) {
    return [{ tag: '_no_tags_' }]
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
  const posts = await blog.getPostsByTag(tag)

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