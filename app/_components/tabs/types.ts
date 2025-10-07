export type TabValue = 'about' | 'blog'

export interface TabConfig {
  value: TabValue
  label: string
  panelId: string
}

export const TABS: TabConfig[] = [
  { value: 'about', label: 'About', panelId: 'panel-about' },
  { value: 'blog', label: 'Blog', panelId: 'panel-blog' }
]

export function getValidTab(searchParams: { tab?: string } | null): TabValue {
  if (!searchParams?.tab) return 'blog'
  if (searchParams.tab === 'about') return 'about'
  return 'blog'
}
