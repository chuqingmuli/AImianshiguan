'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const PhoneCall = dynamic(() => import('@/components/common/PhoneCall'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">加载中...</div>
})

// Coze配置
const COZE_PAT = process.env.NEXT_PUBLIC_COZE_PAT || 'pat_3gB2OKTT48jvYxW1ZP2yzjSr4q0j50w6BsRHS4xDMPBVqJYopaNItH8nvqsLdfT2'
const COZE_BOT_ID_WEB = process.env.NEXT_PUBLIC_COZE_BOT_ID_WEB || '7619349436464742454'
const COZE_BOT_ID_JAVA = process.env.NEXT_PUBLIC_COZE_BOT_ID_JAVA || '7618178031563735083'

export default function PhonePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [interviewType, setInterviewType] = useState<'web' | 'java'>('web')

  useEffect(() => {
    const type = searchParams.get('type') as 'web' | 'java'
    if (type === 'web' || type === 'java') {
      setInterviewType(type)
    }
  }, [searchParams])

  const getInterviewerInfo = () => {
    return {
      name: interviewType === 'java' ? 'Java技术面试官' : 'Web前端面试官',
      description: interviewType === 'java' 
        ? '专注于Java核心技术、Spring框架、微服务架构等领域的技术专家' 
        : '专注于前端框架、JavaScript、性能优化等领域的技术专家',
      avatar: interviewType === 'java' ? '☕' : '🌐'
    }
  }

  const interviewerInfo = getInterviewerInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">电话面试</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* 电话面试主卡板 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12 text-center">
            {/* 面试官信息 */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
              {interviewerInfo.avatar}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              与 {interviewerInfo.name} 电话面试
            </h2>
            <p className="text-gray-600 mb-12 max-w-md mx-auto">
              {interviewerInfo.description} 将通过电话与你进行实时技术面试。
              点击下方电话按钮开始通话，你将获得实时的表达分析反馈。
            </p>

            {/* 电话组件 */}
            <div className="max-w-md mx-auto">
              <PhoneCall
                botId={interviewType === 'web' ? COZE_BOT_ID_WEB : COZE_BOT_ID_JAVA}
                pat={COZE_PAT}
              />
            </div>

            {/* 电话面试说明 */}
            <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">电话面试说明</h3>
              <ul className="text-sm text-blue-800 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>点击绿色电话按钮开始与AI面试官通话</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>通话过程中可以随时静音或结束通话</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>通话结束后将获得详细的表达分析报告</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>请确保麦克风权限已开启，网络连接稳定</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}