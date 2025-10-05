'use client'

import { useState, useEffect } from 'react'
import { getLocalStorage, setLocalStorage } from '@/shared/utils/local-storage'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    return getLocalStorage(key, defaultValue)
  })

  useEffect(() => {
    setLocalStorage(key, value)
  }, [key, value])

  return [value, setValue] as const
}
