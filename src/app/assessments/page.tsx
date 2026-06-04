'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, BarChart3, CheckCircle, Clock, Calendar } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([
    {
      id: '1',
      title: '前端面试评估报告',
      interviewType: 'web',
      score: 85,
      strengths: [
        '技术基础知识扎实',
        '问题分析思路清晰',
        '沟通表达流畅',
        '代码逻辑严谨',
      ],
      improvements: [
        '需要加强性能优化知识',
        '深入理解React Hooks原理',
        '提高系统设计能力',
      ],
      date: new Date('2024-01-15'),
      duration: 45,
    },
    {
      id: '2',
      title: 'Java后端面试评估',
      interviewType: 'java',
      score: 78,
      strengths: [
        'Java基础扎实',
        '数据库设计合理',
        '并发编程理解深入',
      ],
      improvements: [
        'Spring Boot最佳实践',
        '微服务架构设计',
        '性能调优经验',
      ],
      date: new Date('2024-01-10'),
      duration: 50,
    },
  ])

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreText = (score: number) => {
    if (score >= 85) return '优秀'
    if (score >= 70) return '良好'
    if (score >= 60) return '一般'
    return '需要提高'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">能力评估</h1>
        <p className="text-gray-600">查看你的面试评估报告和技能分析</p>
      </div>

      {/* 评估报告列表 */}
      <div className="space-y-6">
        {assessments.map((assessment) => (
          <Card key={assessment.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  <CardDescription>
                    {assessment.interviewType === 'java' ? 'Java后端' : 'Web前端'} • {assessment.date.toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(assessment.score)}`}>
                    {assessment.score}
                  </div>
                  <div className="text-sm text-gray-500">总分</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 评分进度条 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">整体评价</span>
                  <span className={`font-medium ${getScoreColor(assessment.score)}`}>
                    {getScoreText(assessment.score)}
                  </span>
                </div>
                <Progress 
                  value={assessment.score} 
                  className="h-2"
                  style={{
                    '--tw-progress-fill': assessment.score >= 85 ? '#10b981' : 
                                        assessment.score >= 70 ? '#3b82f6' : 
                                        assessment.score >= 60 ? '#f59e0b' : '#ef4444'
                  } as React.CSSProperties}
                />
              </div>

              {/* 详情信息 */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {assessment.date.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {assessment.duration}分钟
                </div>
              </div>

              {/* 优势和改进点 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    优势
                  </h3>
                  <ul className="space-y-2">
                    {assessment.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">改进建议</h3>
                  <ul className="space-y-2">
                    {assessment.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex gap-2">
                <Button variant="outline">
                  查看详细报告
                </Button>
                <Button variant="outline">
                  分享报告
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 技能分析卡片 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>技能趋势分析</CardTitle>
          <CardDescription>你的技能发展趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 前端技能 */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>前端技术</span>
                <span className="text-blue-600">82%</span>
              </div>
              <Progress value={82} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                较上次提高了5%
              </div>
            </div>

            {/* 后端技能 */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>后端技术</span>
                <span className="text-green-600">76%</span>
              </div>
              <Progress value={76} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                较上次提高了3%
              </div>
            </div>

            {/* 沟通能力 */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>沟通表达</span>
                <span className="text-yellow-600">78%</span>
              </div>
              <Progress value={78} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                较上次提高了2%
              </div>
            </div>

            {/* 问题解决 */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>问题解决</span>
                <span className="text-blue-600">80%</span>
              </div>
              <Progress value={80} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                较上次提高了4%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 建议练习按钮 */}
      <div className="mt-8 text-center">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Award className="mr-2 h-4 w-4" />
          开始针对性练习
        </Button>
      </div>
    </div>
  )
}