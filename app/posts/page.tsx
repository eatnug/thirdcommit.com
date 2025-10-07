import { notFound } from 'next/navigation'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { format } from 'date-fns'

export default async function PostPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const slug = params.id

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
