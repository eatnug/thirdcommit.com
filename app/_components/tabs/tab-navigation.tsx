'use client'

import type { TabValue } from './types'
import { TABS } from './types'
import { useRef, useEffect, type KeyboardEvent } from 'react'

interface TabNavigationProps {
  activeTab: TabValue
  onChange: (tab: TabValue) => void
}

export function TabNavigation({ activeTab, onChange }: TabNavigationProps) {
  const tabRefs = useRef<Map<TabValue, HTMLButtonElement>>(new Map())

  useEffect(() => {
    // Focus active tab when changed programmatically (e.g., via URL)
    const activeButton = tabRefs.current.get(activeTab)
    if (activeButton && document.activeElement?.getAttribute('role') === 'tab') {
      activeButton.focus()
    }
  }, [activeTab])

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let targetIndex: number | null = null

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        targetIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1
        break
      case 'ArrowRight':
        e.preventDefault()
        targetIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        e.preventDefault()
        targetIndex = 0
        break
      case 'End':
        e.preventDefault()
        targetIndex = TABS.length - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onChange(TABS[currentIndex].value)
        return
    }

    if (targetIndex !== null) {
      const targetTab = TABS[targetIndex]
      const targetButton = tabRefs.current.get(targetTab.value)
      targetButton?.focus()
    }
  }

  return (
    <div role="tablist" className="flex gap-6 border-b border-border mb-8">
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.value, el)
            }}
            role="tab"
            id={`tab-${tab.panelId}`}
            aria-selected={isActive}
            aria-controls={tab.panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              pb-3 px-1 text-sm font-medium transition-colors
              border-b-2 -mb-[1px]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground
              ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }
            `}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
