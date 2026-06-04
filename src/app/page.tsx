'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Shield, Clock, History, User, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [interviewType, setInterviewType] = useState<'java' | 'web'>('web')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

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
    
    // 检查URL中是否有userId参数，如果有就存储到localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const userId = urlParams.get('userId')
    if (userId) {
      localStorage.setItem('userId', userId)
    }
    
    // 清理监听器
    return () => {
      window.removeEventListener('storage', checkLoginStatus)
      window.removeEventListener('userLoggedIn', checkLoginStatus)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
    setUser(null)
    
    // 触发自定义事件，通知其他组件
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: false }))
  }

  const handleStartInterview = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 优先使用登录用户的ID，否则使用localStorage中的userId
      const existingUserId = user?.id || localStorage.getItem('userId')
      
      // 调用后端API创建面试（支持临时用户）
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: interviewType,
          ...(existingUserId && { userId: existingUserId }), // 只有当existingUserId存在时才传递
          title: `${interviewType === 'web' ? 'Web前端' : 'Java后端'}面试模拟`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '创建面试失败')
      }

      const result = await response.json()
      
      // 存储userId到localStorage，确保后续能访问历史记录
      localStorage.setItem('userId', result.interview.userId)
      
      // 创建成功，跳转到面试页面，传递用户ID
      router.push(`/interview/${result.interview.id}?userId=${result.interview.userId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建面试失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* 装饰性元素 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100/5 rounded-full blur-3xl" />
      
      <main className="relative z-10">
        {/* 顶部导航栏 */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-gray-900">CodeCanvas</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const userId = user?.id || localStorage.getItem('userId')
                  if (userId) {
                    router.push(`/history?userId=${encodeURIComponent(userId)}`)
                  } else {
                    router.push('/history')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <History className="h-4 w-4" />
                <span>历史记录</span>
              </button>
              <button
                onClick={() => {
                  router.push(`/phone?type=${interviewType}`)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>电话面试</span>
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{user.name || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>退出</span>
                  </button>
                </div>
              ) : (
                <a
                  href="/auth/signin"
                  target="_self"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors z-10 relative"
                >
                  <User className="h-4 w-4" />
                  <span>登录/注册</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 md:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-start gap-12">
              {/* 左侧内容区域 */}
              <div className="md:w-2/3 space-y-12">
                {/* 大标题 */}
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                  style={{ 
                    background: 'linear-gradient(135deg, #1e3a8a, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  在 CodeCanvas，与技术对话
                  <br />
                  为下一次成功铺路
                </h1>

                {/* 副标题/简介 */}
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                  CodeCanvas是为计算机岗位量身打造的AI对话平台。在这里，你将与专业的AI面试官进行深度技术对话，获得清晰、结构化的复盘反馈。我们致力于将每一次模拟，都转化为可被衡量和追溯的成长。
                </p>

                {/* 岗位选择 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">选择面试岗位</label>
                  <div className="flex gap-3">
                    <Button
                      variant={interviewType === 'web' ? 'default' : 'outline'}
                      onClick={() => setInterviewType('web')}
                      className={`flex-1 transition-all duration-300 ease-in-out ${interviewType === 'web' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-50'}`}
                    >
                      Web前端
                    </Button>
                    <Button
                      variant={interviewType === 'java' ? 'default' : 'outline'}
                      onClick={() => setInterviewType('java')}
                      className={`flex-1 transition-all duration-300 ease-in-out ${interviewType === 'java' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-50'}`}
                    >
                      Java后端
                    </Button>
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="w-full sm:w-auto px-8 py-6 rounded-xl font-semibold text-base transition-all duration-300 ease-in-out hover:shadow-lg"
                    onClick={handleStartInterview}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        准备中...
                      </>
                    ) : (
                      <>
                        立即开始对话
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-6 rounded-xl font-medium text-base transition-all duration-300 ease-in-out hover:bg-gray-50">
                    <Play className="mr-2 h-4 w-4" />
                    观看演示视频
                  </Button>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* 快速体验模式提示 */}
                <div className="mt-6">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4 transition-all duration-300 ease-in-out hover:shadow-md">
                    <div className="mt-0.5">
                      <Shield className="h-5 w-5 text-blue-500 transition-transform duration-300 hover:scale-110" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium">无需登录，快速体验</p>
                      <p className="text-xs text-blue-700 mt-1">
                        您正在使用临时用户模式，面试数据仅保存在当前会话中，刷新页面后数据将重置。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 底部标签 */}
                <div className="mt-8">
                  <span className="text-sm text-gray-500 font-light tracking-wider">专业的开发者成长平台</span>
                </div>
              </div>

              {/* 右侧视觉区域 */}
              <div className="md:w-1/3 relative">
                {user ? (
                  <div className="block w-full bg-white rounded-2xl shadow-soft p-8 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium text-lg">{user.name || user.email}</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href="/auth/signin"
                    target="_self"
                    className="block w-full bg-white rounded-2xl shadow-soft p-8 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium text-lg">登录/注册</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}