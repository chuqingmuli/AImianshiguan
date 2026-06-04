'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LogOut, Menu, X, Home, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (isLoggedIn) {
        const userInfo = localStorage.getItem('user')
        if (userInfo) {
          setUser(JSON.parse(userInfo))
        }
      } else {
        setUser(null)
      }
    }
    
    // 初始检查
    checkLoginStatus()
    
    // 监听localStorage变化
    window.addEventListener('storage', checkLoginStatus)
    
    // 监听自定义登录状态变化事件
    window.addEventListener('userLoggedIn', checkLoginStatus)
    
    // 清理监听器
    return () => {
      window.removeEventListener('storage', checkLoginStatus)
      window.removeEventListener('userLoggedIn', checkLoginStatus)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    setUser(null)
    
    // 触发自定义事件，通知其他组件
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: false }))
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gray-100 rounded-lg p-2">
              <User className="h-6 w-6 text-gray-700" />
            </div>
            <span className="text-xl font-semibold">CodeCanvas</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* 只保留首页链接 */}
            <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
              <Home className="h-4 w-4" />
              首页
            </Link>
            {/* 历史记录 */}
            <Link href="/history" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium" onClick={(e) => {
              e.preventDefault()
              const userId = localStorage.getItem('userId')
              if (userId) {
                window.location.href = `/history?userId=${encodeURIComponent(userId)}`
              } else {
                window.location.href = '/history'
              }
            }}>
              <BookOpen className="h-4 w-4" />
              历史记录
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  {user.name || user.email}
                </Link>
                <Button variant="outline" onClick={handleLogout} className="rounded-lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <a
                href="/auth/signin"
                target="_self"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>登录/注册</span>
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* 只保留首页链接 */}
            <Link href="/" className="block py-2 flex items-center gap-3 text-gray-700 hover:text-gray-900 font-medium">
              <Home className="h-5 w-5" />
              首页
            </Link>
            {/* 历史记录 */}
            <Link href="/history" className="block py-2 flex items-center gap-3 text-gray-700 hover:text-gray-900 font-medium" onClick={(e) => {
              e.preventDefault()
              const userId = localStorage.getItem('userId')
              if (userId) {
                window.location.href = `/history?userId=${encodeURIComponent(userId)}`
              } else {
                window.location.href = '/history'
              }
            }}>
              <BookOpen className="h-5 w-5" />
              历史记录
            </Link>
            
            {user ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                <Link href="/profile" className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <User className="h-5 w-5" />
                  {user.name || user.email}
                </Link>
                <Button variant="outline" onClick={handleLogout} className="w-full rounded-lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                <a
                  href="/auth/signin"
                  target="_self"
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full"
                >
                  <User className="h-4 w-4" />
                  <span>登录/注册</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}