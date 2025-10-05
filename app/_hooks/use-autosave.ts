'use client'

import { useEffect, useRef } from 'react'

interface UseAutosaveOptions<T> {
  data: T
  onSave: (data: T) => void
  interval?: number
}

export function useAutosave<T>({ data, onSave, interval = 30000 }: UseAutosaveOptions<T>) {
  const savedCallback = useRef(onSave)
  const lastSaveTime = useRef<number>(Date.now())

  // Update callback ref when it changes
  useEffect(() => {
    savedCallback.current = onSave
  }, [onSave])

  // Set up autosave interval
  useEffect(() => {
    const timer = setInterval(() => {
      savedCallback.current(data)
      lastSaveTime.current = Date.now()
    }, interval)

    return () => clearInterval(timer)
  }, [data, interval])

  // Return last save time for UI display
  return lastSaveTime
}
