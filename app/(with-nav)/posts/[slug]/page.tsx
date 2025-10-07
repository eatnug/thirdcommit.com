import { notFound } from 'next/navigation'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { format } from 'date-fns'

export async function generateStaticParams() {
  const repository = await getServerPostRepository()
  const blog = createBlogApi(repository)
  const posts = await blog.getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  try {
    const repository = await getServerPostRepository()
    const blog = createBlogApi(repository)
    const post = await blog.getPost(decodeURIComponent(slug))

    return (
      <div className="px-4 md:px-[400px] py-[20px]">
        <article className="max-w-[928px]">
          <div className="flex flex-col gap-[10px] py-[20px]">
            <h1 className="text-[25px] font-medium text-black">
              {post.title}
            </h1>
            <p className="text-[15px] text-black">
              {format(post.created_at, 'MMMM d, yyyy')}
            </p>
            <div
              className="prose prose-neutral max-w-none text-[18px] text-black mt-[10px]"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </div>
        </article>
      </div>
    )
  } catch {
    notFound()
  }
}
