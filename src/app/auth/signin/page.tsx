'use client'

import { useState } from 'react'

export default function SignInPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 模拟登录过程
    setTimeout(() => {
      try {
        // 存储用户信息到localStorage
        if (username === 'admin' && password === 'admin123') {
          localStorage.setItem('user', JSON.stringify({
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com'
          }))
        } else {
          const userId = Date.now().toString()
          localStorage.setItem('user', JSON.stringify({
            id: userId,
            name: username,
            email: `${username}@example.com`
          }))
        }
        
        localStorage.setItem('isLoggedIn', 'true')
        
        // 跳转到首页
        window.location.href = '/'
      } catch (err) {
        setError('登录失败，请稍后重试')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-4xl">C</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登录 CodeCanvas
          </h2>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>开发环境测试账号：admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}