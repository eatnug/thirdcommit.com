import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { PostCard } from '@/app/(with-nav)/blog/_components/post-card'

export default async function BlogPage() {
  const repository = await getServerPostRepository()
  const blog = createBlogApi(repository)
  const posts = await blog.getPosts()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <div className="grid gap-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}