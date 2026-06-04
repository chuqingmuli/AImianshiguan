'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Play, Calendar, Clock, CheckCircle } from 'lucide-react'

export default function InterviewsPage() {
  const [interviewType, setInterviewType] = useState<'java' | 'web'>('web')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const mockInterviews = [
    {
      id: '1',
      title: '前端面试模拟',
      type: 'web',
      status: 'completed' as const,
      startedAt: new Date('2024-01-15T14:30:00'),
      completedAt: new Date('2024-01-15T15:15:00'),
      duration: 45,
    },
    {
      id: '2',
      title: 'Java面试练习',
      type: 'java',
      status: 'active' as const,
      startedAt: new Date('2024-01-16T10:00:00'),
      completedAt: null,
      duration: null,
    },
    {
      id: '3',
      title: '前端技术面试',
      type: 'web',
      status: 'preparing' as const,
      startedAt: null,
      completedAt: null,
      duration: null,
    },
  ]

  const handleCreateInterview = async () => {
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: interviewType,
          title: title || `${interviewType === 'java' ? 'Java' : 'Web前端'}面试 ${new Date().toLocaleDateString()}`,
          description,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('面试创建成功:', data)
        setShowCreateForm(false)
        setTitle('')
        setDescription('')
      } else {
        const error = await response.json()
        console.error('创建面试失败:', error)
      }
    } catch (error) {
      console.error('创建面试时发生错误:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">进行中</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">已完成</span>
      case 'preparing':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">准备中</span>
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">已取消</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">未知</span>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">模拟面试</h1>
        <p className="text-gray-600">选择面试类型开始练习</p>
      </div>

      {/* 创建面试按钮 */}
      <div className="mb-8">
        <Button 
          onClick={() =>setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          {showCreateForm ? '取消' : '创建新面试'}
        </Button>
      </div>

      {/* 创建面试表单 */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>创建新面试</CardTitle>
            <CardDescription>选择面试类型并填写相关信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>面试类型</Label>
              <div className="flex gap-4">
                <Button
                  variant={interviewType === 'web' ? 'default' : 'outline'}
                  onClick={() =>setInterviewType('web')}
                  className={interviewType === 'web' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Web前端
                </Button>
                <Button
                  variant={interviewType === 'java' ? 'default' : 'outline'}
                  onClick={() =>setInterviewType('java')}
                  className={interviewType === 'java' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Java后端
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>面试标题（可选）</Label>
              <Input
                placeholder={`${interviewType === 'java' ? 'Java' : 'Web前端'}面试 ${new Date().toLocaleDateString()}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>面试描述（可选）</Label>
              <Textarea
                placeholder="描述这次面试的目的或关注点"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleCreateInterview}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              开始面试
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 面试列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">我的面试</h2>
        {mockInterviews.map((interview) => (
          <Card key={interview.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{interview.title}</CardTitle>
                  <CardDescription>
                    {interview.type === 'java' ? 'Java后端' : 'Web前端'} • {getStatusBadge(interview.status)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {interview.startedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {interview.startedAt.toLocaleDateString()}
                  </div>
                )}
                {interview.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {interview.duration}分钟
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {interview.status === 'active' && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    继续面试
                  </Button>
                )}
                {interview.status === 'preparing' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 h-4 w-4" />
                    开始面试
                  </Button>
                )}
                {interview.status === 'completed' && (
                  <>
                    <Button variant="outline">
                      查看详情
                    </Button>
                    <Button variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      查看报告
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}