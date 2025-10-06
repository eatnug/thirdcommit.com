import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/card'
import { Badge } from '@/app/_components/badge'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Post } from '@/domain/blog/entities/post.entity'

export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={`/posts/${encodeURIComponent(post.title)}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(post.created_at, 'MMM dd, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {post.description && (
          <p className="text-muted-foreground mb-4">
            {post.description}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          {post.tags.map(tag => (
            <Link key={tag} href={`/tags/${tag}`}>
              <Badge variant="secondary">{tag}</Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}