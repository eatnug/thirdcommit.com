import { Suspense } from 'react'
import { createBlogApi, getServerPostRepository } from '@/domain/blog'
import { createProjectsApi, getProjectRepository } from '@/domain/projects'
import { TabsUI } from '@/app/_components/tabs/tabs-ui'

export default async function HomePage() {
  // Default tab for static export
  const initialTab = 'blog'

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

export async function generateMetadata() {
  return {
    title: 'Jake Park - Software Engineer',
    description: 'Software engineer. Love to create something',
    openGraph: {
      title: 'Jake Park - Software Engineer',
      description: 'Software engineer. Love to create something',
      url: 'https://thirdcommit.com/'
    }
  }
}
