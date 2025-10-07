'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PostSlugRedirect({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/posts?id=${encodeURIComponent(slug)}`)
  }, [slug, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
