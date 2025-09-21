import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Post } from '@/lib/types'

export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={`/posts/${post.slug}`} className="hover:underline">
            {post.frontmatter.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(post.frontmatter.date), 'MMM dd, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {post.frontmatter.description && (
          <p className="text-muted-foreground mb-4">
            {post.frontmatter.description}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          {post.frontmatter.tags.map(tag => (
            <Link key={tag} href={`/tags/${tag}`}>
              <Badge variant="secondary">{tag}</Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}