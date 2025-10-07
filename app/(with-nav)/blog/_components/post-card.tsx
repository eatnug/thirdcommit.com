import Link from 'next/link'
import { format } from 'date-fns'
import type { Post } from '@/domain/blog/entities/post.entity'

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${encodeURIComponent(post.slug)}`}>
      <div className="border-b border-[#bbbbbb] py-[20px] flex flex-col gap-[10px]">
        <h2 className="text-[25px] font-medium text-black">
          {post.title}
        </h2>
        <p className="text-[15px] text-black">
          {format(post.created_at, 'MMMM d, yyyy')}
        </p>
        {post.description && (
          <p className="text-[18px] text-black">
            {post.description}
          </p>
        )}
      </div>
    </Link>
  )
}