import { Suspense } from 'react'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { createProjectsApi, getProjectRepository } from '@/domain/projects'
import { getValidTab } from '@/app/_components/tabs/types'
import { TabsUI } from '@/app/_components/tabs/tabs-ui'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const initialTab = getValidTab(params)

  // Fetch data in parallel
  const [projects, posts] = await Promise.all([
    createProjectsApi(getProjectRepository()).getProjects(),
    createBlogApi(await getServerPostRepository()).getPosts()
  ])

  return (
    <main className="px-4 md:px-[400px] py-[20px] flex flex-col gap-[20px]">
      <Suspense fallback={<div>Loading...</div>}>
        <TabsUI initialTab={initialTab} posts={posts} projects={projects} />
      </Suspense>
    </main>
  )
}

export async function generateMetadata({ searchParams }: HomePageProps) {
  const params = await searchParams
  const tab = getValidTab(params)

  if (tab === 'blog') {
    return {
      title: 'Blog - Jake Park',
      description: 'Articles about software engineering, AI, and vibe-coding experiments.',
      openGraph: {
        title: 'Blog - Jake Park',
        description: 'Articles about software engineering, AI, and vibe-coding experiments.',
        url: 'https://thirdcommit.com/?tab=blog'
      }
    }
  }

  return {
    title: 'Jake Park - Software Engineer',
    description: 'Software engineer. Desperately trying to keep up with this big, disruptive wave of innovation.',
    openGraph: {
      title: 'Jake Park - Software Engineer',
      description: 'Software engineer. Desperately trying to keep up with this big, disruptive wave of innovation.',
      url: 'https://thirdcommit.com/'
    }
  }
}
