'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Star, AlertCircle, CheckCircle } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import { useEvaluation } from '@/hooks/use-interview'

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id: interviewId } = params
  const [downloading, setDownloading] = useState(false)
  
  const router = useRouter()
  
  // 获取评估报告
  const { data: evaluation, isLoading, error } = useEvaluation(interviewId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Download className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载评估报告...</p>
        </div>
      </div>
    )
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">获取评估报告失败</p>
          <Button onClick={() => router.push('/interviews')}>
            返回面试列表
          </Button>
        </div>
      </div>
    )
  }

  // 准备雷达图数据
  const radarData = [
    { subject: '技术能力', A: evaluation.data.scores.technical, fullMark: 100 },
    { subject: '沟通表达', A: evaluation.data.scores.communication, fullMark: 100 },
    { subject: '问题解决', A: evaluation.data.scores.problemSolving, fullMark: 100 },
    { subject: '知识深度', A: evaluation.data.scores.depth, fullMark: 100 },
    { subject: '综合评分', A: evaluation.data.scores.overall, fullMark: 100 },
  ]

  // 下载报告
  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      const reportContent = `
CodeCanvas AI面试评估报告

综合评分: ${evaluation.data.scores.overall}分

评分详情:
- 技术能力: ${evaluation.data.scores.technical}分
- 沟通表达: ${evaluation.data.scores.communication}分
- 问题解决: ${evaluation.data.scores.problemSolving}分
- 知识深度: ${evaluation.data.scores.depth}分

优势:
${evaluation.data.feedback.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

改进点:
${evaluation.data.feedback.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

建议:
${evaluation.data.feedback.recommendations}

生成时间: ${new Date().toLocaleString('zh-CN')}
      `
      
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `面试评估报告_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('下载报告失败:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">面试评估报告</h1>
              <p className="text-gray-600 mt-1">
                评估时间: {new Date(evaluation.evaluationReport.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <Button 
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? '下载中...' : '下载报告'}
            </Button>
          </div>
        </div>

        {/* 综合评分卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              综合评分
            </CardTitle>
            <CardDescription>你的面试表现总体评价</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {evaluation.data.scores.overall}
              </div>
              <div className="text-gray-600">
                {evaluation.data.scores.overall >= 85 ? '优秀' : 
                 evaluation.data.scores.overall >= 70 ? '良好' : 
                 evaluation.data.scores.overall >= 60 ? '合格' : '需要提升'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 雷达图 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>能力维度分析</CardTitle>
            <CardDescription>各维度详细评分</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="评分"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 优势和改进点 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 优势 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                优势
              </CardTitle>
              <CardDescription>你的强项和亮点</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.data.feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 改进点 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                改进点
              </CardTitle>
              <CardDescription>需要提升的方面</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.data.feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 详细建议 */}
        <Card>
          <CardHeader>
            <CardTitle>详细建议</CardTitle>
            <CardDescription>AI面试官的专业建议</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {evaluation.data.feedback.recommendations}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <Button onClick={() => router.push('/interviews')} variant="outline">
            返回面试列表
          </Button>
        </div>
      </div>
    </div>
  )
}