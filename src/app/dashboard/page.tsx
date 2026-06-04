'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Clock, Award, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    totalTime: 0,
  })

  useEffect(() => {
    // 这里可以从API获取真实数据
    // 暂时使用模拟数据
    setStats({
      totalInterviews: 5,
      completedInterviews: 3,
      averageScore: 85,
      totalTime: 120, // 分钟
    })
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">仪表盘</h1>
        <p className="text-gray-600">查看你的面试统计和进度</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">总面试次数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</div>
            <div className="text-sm text-gray-500 mt-1">次模拟面试</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">已完成面试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedInterviews}</div>
            <div className="text-sm text-gray-500 mt-1">次完成的面试</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">平均评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.averageScore}</div>
            <div className="text-sm text-gray-500 mt-1">分 / 100分</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">总练习时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalTime}</div>
            <div className="text-sm text-gray-500 mt-1">分钟</div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>选择一个面试类型开始练习</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/interviews">
                <Button className="w-full h-24 bg-blue-50 hover:bg-blue-100 text-gray-900">
                  <BookOpen className="mr-2 h-5 w-5" />
                  开始新面试
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-24">
                <Award className="mr-2 h-5 w-5" />
                查看评估报告
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>你的面试历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">前端面试模拟</div>
                    <div className="text-sm text-gray-500">今天 14:30</div>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">已完成</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Java面试评估</div>
                    <div className="text-sm text-gray-500">昨天 16:45</div>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">已完成</span>
              </div>

              <Button variant="outline" className="w-full mt-2">
                查看所有历史
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}