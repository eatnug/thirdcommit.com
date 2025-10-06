import { blog } from '@/domain/blog'
import { PostCard } from '@/app/(with-nav)/blog/_components/post-card'

export default async function BlogPage() {
  const posts = await blog.getPosts()
  const publishedPosts = posts.filter(post => !post.draft)

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <div className="grid gap-6">
        {publishedPosts.map(post => (
          <PostCard key={post.title} post={post} />
        ))}
      </div>
    </div>
  )
}