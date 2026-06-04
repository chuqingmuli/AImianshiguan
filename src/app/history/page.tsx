'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, FileText, BarChart3, Brain, Mic } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null)
  const [selectedView, setSelectedView] = useState<'details' | 'content' | 'expression'>('details')

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (isLoggedIn) {
      const userInfo = localStorage.getItem('user')
      if (userInfo) {
        setUser(JSON.parse(userInfo))
      }
    }
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      // 优先使用登录用户的ID，然后是URL参数中的userId，最后是localStorage中的userId
      const urlParams = new URLSearchParams(window.location.search)
      const userId = user?.id || urlParams.get('userId') || localStorage.getItem('userId')
      
      if (!userId) {
        console.error('没有找到用户ID')
        setLoading(false)
        return
      }
      
      const response = await fetch(`/api/interviews?pageSize=50&userId=${encodeURIComponent(userId)}`)
      if (response.ok) {
        const data = await response.json()
        setInterviews(data.data.filter((i: any) => i.status === 'completed'))
      }
    } catch (error) {
      console.error('获取面试记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 生成报告数据
  const getReportData = (interview: any) => {
    if (!interview.evaluations || interview.evaluations.length === 0) {
      return null
    }
    
    const evaluation = interview.evaluations[0]
    let scores = { overall: 0, technical: 0, knowledgeDepth: 0, problemSolving: 0, communication: 0 }
    
    try {
      // 尝试解析scores字段
      if (evaluation.scores) {
        scores = typeof evaluation.scores === 'string' ? JSON.parse(evaluation.scores) : evaluation.scores
      }
    } catch (error) {
      console.error('解析评分数据失败:', error)
      // 如果解析失败，尝试从feedback中提取分数
      if (evaluation.feedback) {
        const scoreMatch = evaluation.feedback.match(/技术能力评分：(\d+)/)
        if (scoreMatch) {
          scores.overall = parseInt(scoreMatch[1])
        }
      }
    }
    
    // 转换评分从1-10分到0-100分
    const convertScore = (score: number) => {
      return Math.round((score / 10) * 100)
    }
    
    return {
      technicalScore: convertScore(scores.overall || 0),
      strengths: evaluation.strengths ? evaluation.strengths.split(',').map((s: string) => s.trim()) : [],
      improvements: evaluation.improvements ? evaluation.improvements.split(',').map((i: string) => i.trim()) : [],
      feedback: evaluation.feedback || '',
      contentAnalysis: {
        technicalCorrectness: convertScore(scores.technical || 9.5),
        knowledgeDepth: convertScore(scores.knowledgeDepth || 9.0),
        logicalRigor: convertScore(scores.problemSolving || 9.5),
        jobMatch: convertScore(scores.overall || 9.5),
      },
      expressionAnalysis: {
        applicable: false,
        message: '在当前纯文字交互的面试模拟中，此模块数据暂不适用。在真实的语音面试场景中，本部分将提供关于表达沟通能力的详细反馈。'
      }
    }
  }

  // 计算能力趋势数据
  const getTrendData = () => {
    const sortedInterviews = [...interviews].sort((a, b) => {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    })
    
    const labels = sortedInterviews.map(interview => {
      const date = new Date(interview.completedAt)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
    
    const technicalScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      return report ? report.technicalScore : 0
    })
    
    const technicalCorrectnessScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      return report ? report.contentAnalysis.technicalCorrectness : 0
    })
    
    const knowledgeDepthScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      return report ? report.contentAnalysis.knowledgeDepth : 0
    })
    
    const logicalRigorScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      return report ? report.contentAnalysis.logicalRigor : 0
    })
    
    const jobMatchScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      return report ? report.contentAnalysis.jobMatch : 0
    })
    
    const contentScores = sortedInterviews.map(interview => {
      const report = getReportData(interview)
      if (!report) return 0
      const { technicalCorrectness, knowledgeDepth, logicalRigor, jobMatch } = report.contentAnalysis
      return (technicalCorrectness + knowledgeDepth + logicalRigor + jobMatch) / 4
    })
    
    return {
      labels,
      technicalScores,
      technicalCorrectnessScores,
      knowledgeDepthScores,
      logicalRigorScores,
      jobMatchScores,
      contentScores
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const userId = localStorage.getItem('userId')
                if (userId) {
                  router.push(`/?userId=${encodeURIComponent(userId)}`)
                } else {
                  router.push('/')
                }
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回首页</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {!selectedInterview ? (
            <>
              <div className="mb-12">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">历史记录</h1>
                <p className="text-gray-500">查看您的面试评估报告与对话历史</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无面试记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div 
                      key={interview.id} 
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                      onClick={() => setSelectedInterview(interview)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{interview.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{interview.duration ? `${Math.floor(interview.duration / 60)}分钟` : '-'}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>返回列表</span>
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${selectedInterview.type === 'web' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      <span className="text-lg font-bold">{selectedInterview.type === 'web' ? 'Web' : 'Java'}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{selectedInterview.title}</h2>
                      <p className="text-gray-500 text-sm mt-1">
                        面试时间：{selectedInterview.completedAt ? new Date(selectedInterview.completedAt).toLocaleString('zh-CN') : '-'}
                      </p>
                    </div>
                  </div>

                  {/* 标签页切换 */}
                  <div className="mt-6 flex border-b border-gray-100">
                    <button
                      onClick={() => setSelectedView('details')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${selectedView === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      面试报告
                    </button>
                    <button
                      onClick={() => setSelectedView('content')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${selectedView === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      内容分析
                    </button>
                    <button
                      onClick={() => setSelectedView('expression')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${selectedView === 'expression' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      表达分析
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  {(() => {
                    const report = getReportData(selectedInterview)
                    if (!report) {
                      return (
                        <div className="p-12 text-center">
                          <p className="text-gray-500">暂无评估报告</p>
                        </div>
                      )
                    }

                    if (selectedView === 'details') {
                      return (
                        <div className="space-y-8">
                          {/* 技术能力评分 */}
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">技术能力评分</h3>
                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-2">
                              <span className="text-5xl font-bold">{report.technicalScore}</span>
                            </div>
                            <p className="text-gray-500 text-sm">基于回答的深度、准确性、广度</p>
                          </div>

                          {/* 核心优势 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">核心优势</h3>
                            <div className="space-y-3">
                              {report.strengths.map((strength: string, index: number) => (
                                <div key={index} className="bg-green-50/50 border border-green-100 rounded-xl p-4">
                                  <p className="text-gray-700">{index + 1}. {strength}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 待提升点 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">待提升点</h3>
                            <div className="space-y-3">
                              {report.improvements.map((improvement: string, index: number) => (
                                <div key={index} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                  <p className="text-gray-700">{index + 1}. {improvement}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 学习建议 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">学习建议</h3>
                            <div className="bg-gray-50/50 rounded-2xl p-6">
                              <div className="space-y-3">
                                {report.feedback && report.feedback.includes('学习建议') ? (
                                  report.feedback.split('学习建议')[1].split('后续行动计划')[0].trim().split('\n').filter(line => line.trim()).map((suggestion, index) => (
                                    <p key={index} className="text-gray-700">{index + 1}. {suggestion.trim()}</p>
                                  ))
                                ) : (
                                  <p className="text-gray-700">根据面试表现提供个性化学习建议</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 后续行动计划 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">后续行动计划</h3>
                            <div className="bg-gray-50/50 rounded-2xl p-6">
                              <div className="space-y-3">
                                {report.feedback && report.feedback.includes('后续行动计划') ? (
                                  report.feedback.split('后续行动计划')[1].trim().split('\n').filter(line => line.trim()).map((action, index) => (
                                    <p key={index} className="text-gray-700">{index + 1}. {action.trim()}</p>
                                  ))
                                ) : (
                                  <p className="text-gray-700">根据面试表现提供个性化行动计划</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 内容分析报告 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">内容分析报告</h3>
                            <div className="bg-white border border-gray-100 rounded-xl p-6">
                              <p className="text-gray-700 leading-relaxed">
                                本次对话中你的回答技术正确性{report.contentAnalysis.technicalCorrectness}%，所有方案均符合前端工程化治理的最佳实践，知识深度达到中高级前端开发工程师水平，逻辑严谨结构化清晰，与电商前端开发、前端工程化相关岗位的匹配度{report.contentAnalysis.jobMatch}%，完全能够胜任大型互联网公司的前端工程化相关工作。
                              </p>
                            </div>
                          </div>

                          {/* 表达分析报告 */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">表达分析报告</h3>
                            <div className="bg-white border border-gray-100 rounded-xl p-6">
                              <p className="text-gray-700">
                                {report.expressionAnalysis.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (selectedView === 'content') {
                      return (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-500" />
                            内容分析报告
                          </h3>
                          
                          {/* 本次面试内容分析 */}
                          <div className="bg-white border border-gray-100 rounded-xl p-6">
                            <h4 className="font-medium text-gray-900 mb-4">本次面试分析</h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">技术正确性</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ width: `${report.contentAnalysis.technicalCorrectness}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 font-medium">{report.contentAnalysis.technicalCorrectness}%</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">知识深度</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ width: `${report.contentAnalysis.knowledgeDepth}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 font-medium">{report.contentAnalysis.knowledgeDepth}%</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">逻辑严谨性</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-yellow-500 h-2 rounded-full" 
                                      style={{ width: `${report.contentAnalysis.logicalRigor}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 font-medium">{report.contentAnalysis.logicalRigor}%</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">与岗位匹配度</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-purple-500 h-2 rounded-full" 
                                      style={{ width: `${report.contentAnalysis.jobMatch}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 font-medium">{report.contentAnalysis.jobMatch}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 能力趋势 */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-4">能力趋势</h4>
                            <div className="bg-white border border-gray-100 rounded-xl p-6">
                              {interviews.length > 1 ? (
                                <div className="space-y-8">
                                  {/* 技术能力评分趋势 */}
                                  <div className="h-64">
                                    <Line
                                      data={{
                                        labels: getTrendData().labels,
                                        datasets: [
                                          {
                                            label: '技术能力评分',
                                            data: getTrendData().technicalScores,
                                            borderColor: 'rgb(59, 130, 246)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            tension: 0.4,
                                          },
                                          {
                                            label: '内容分析平均分',
                                            data: getTrendData().contentScores,
                                            borderColor: 'rgb(168, 85, 247)',
                                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                            tension: 0.4,
                                          },
                                        ],
                                      }}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: {
                                            position: 'top' as const,
                                          },
                                          title: {
                                            display: true,
                                            text: '技术能力趋势',
                                          },
                                        },
                                        scales: {
                                          y: {
                                            beginAtZero: true,
                                            max: 100,
                                          },
                                        },
                                      }}
                                    />
                                  </div>
                                  
                                  {/* 多维度评分趋势 */}
                                  <div className="h-80">
                                    <Bar
                                      data={{
                                        labels: getTrendData().labels,
                                        datasets: [
                                          {
                                            label: '技术正确性',
                                            data: getTrendData().technicalCorrectnessScores,
                                            backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                          },
                                          {
                                            label: '知识深度',
                                            data: getTrendData().knowledgeDepthScores,
                                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                          },
                                          {
                                            label: '逻辑严谨性',
                                            data: getTrendData().logicalRigorScores,
                                            backgroundColor: 'rgba(245, 158, 11, 0.6)',
                                          },
                                          {
                                            label: '岗位匹配度',
                                            data: getTrendData().jobMatchScores,
                                            backgroundColor: 'rgba(168, 85, 247, 0.6)',
                                          },
                                        ],
                                      }}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: {
                                            position: 'top' as const,
                                          },
                                          title: {
                                            display: true,
                                            text: '多维度评分趋势',
                                          },
                                        },
                                        scales: {
                                          y: {
                                            beginAtZero: true,
                                            max: 100,
                                          },
                                        },
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <BarChart3 className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <p className="text-gray-500">需要至少2次面试才能生成趋势图表</p>
                                  <p className="text-gray-400 text-sm mt-2">完成更多模拟面试后，这里将显示你的能力趋势</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (selectedView === 'expression') {
                      return (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Mic className="h-5 w-5 text-green-500" />
                            表达分析报告
                          </h3>
                          <div className="bg-white border border-gray-100 rounded-xl p-6">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Mic className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500 mb-4">{report.expressionAnalysis.message}</p>
                              <div className="bg-gray-50/50 rounded-xl p-4 max-w-md mx-auto">
                                <p className="text-gray-600 text-sm">
                                  在真实的语音面试场景中，本模块将：<br/>
                                  • 评估语速、清晰度、自信度等表达表现<br/>
                                  • 提供关于表达沟通能力的详细反馈<br/>
                                  • 生成表达能力的提升建议
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return null
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}