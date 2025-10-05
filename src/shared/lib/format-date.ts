import { format as formatFns } from 'date-fns'

export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatFns(dateObj, formatStr)
}
