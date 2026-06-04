import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 日期格式化
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'yyyy年MM月dd日 HH:mm')
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return '今天'
  } else if (diffInDays === 1) {
    return '昨天'
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks}周前`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months}个月前`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years}年前`
  }
}

// 评分格式化
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
  
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars)
}

// 字符串处理
export function truncateText(text: string, maxLength: number): string {
  if (text.length<= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function capitalizeFirstLetter(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// 数组处理
export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i< array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

// 对象处理
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>{
  const result: Partial<T>= {}
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result as Pick<T, K>
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>{
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result as Omit<T, K>
}

// 验证函数
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 安全处理
export function sanitizeHTML(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 存储工具
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error getting localStorage:', error)
    return defaultValue
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error setting localStorage:', error)
  }
}

export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing localStorage:', error)
  }
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}