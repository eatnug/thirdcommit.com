import { getPostsUseCase } from '@/core/use-cases/get-posts.use-case'
import { PostCard } from '@/presentation/components/blog/post-card'

export default async function BlogPage() {
  const posts = await getPostsUseCase()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <div className="grid gap-6">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}