'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TabValue } from './types'
import { getValidTab } from './types'
import { TabNavigation } from './tab-navigation'
import { TabPanel } from './tab-panel'
import { ProjectsList } from '@/app/_components/projects/projects-list'
import { BlogList } from '@/app/_components/blog/blog-list'
import type { Post } from '@/domain/blog'
import type { Project } from '@/domain/projects'

interface TabsUIProps {
  initialTab: TabValue
  posts: Post[]
  projects: Project[]
}

export function TabsUI({ initialTab, posts, projects }: TabsUIProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  // Sync state with URL changes (browser back/forward)
  useEffect(() => {
    const tab = getValidTab({ tab: searchParams.get('tab') || undefined })
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab)

    // Update URL without scroll
    const newUrl = tab === 'about' ? '/' : `/?tab=${tab}`
    router.replace(newUrl, { scroll: false })
  }

  return (
    <>
      <TabPanel id="panel-about" isActive={activeTab === 'about'}>
        <ProjectsList projects={projects} />
      </TabPanel>

      <TabPanel id="panel-blog" isActive={activeTab === 'blog'}>
        <BlogList posts={posts} />
      </TabPanel>
    </>
  )
}
