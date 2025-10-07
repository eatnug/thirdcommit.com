interface TabPanelProps {
  id: string
  isActive: boolean
  children: React.ReactNode
}

export function TabPanel({ id, isActive, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      tabIndex={0}
      className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground"
    >
      {children}
    </div>
  )
}
