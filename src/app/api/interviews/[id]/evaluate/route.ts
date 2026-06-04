import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CozeAgentService, Message as CozeMessage } from '@/lib/coze-agent-service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized'
    }, { status: 401 })
  }

  try {
    const { id: interviewId } = params

    // 验证面试是否存在且属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId: session.user.id,
      },
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }

    // 获取面试完整对话历史
    const conversation = await prisma.message.findMany({
      where: { interviewId },
      orderBy: { timestamp: 'asc' },
    })

    if (conversation.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No conversation history found for this interview'
      }, { status: 400 })
    }

    // 转换为Coze服务要求的格式
    const cozeMessages: CozeMessage[] = conversation.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // 调用Coze智能体生成评估报告
    let evaluationData = null
    try {
      const cozeService = new CozeAgentService()
      const evaluation = await cozeService.generateEvaluation(
        interview.type as 'java' | 'web',
        cozeMessages,
        `interview-${interviewId}`
      )

      // 构建评估数据结构
      evaluationData = {
        scores: {
          technical: evaluation.technical,
          communication: evaluation.communication,
          problemSolving: evaluation.problemSolving,
          depth: evaluation.knowledgeDepth,
          overall: evaluation.overall,
        },
        feedback: {
          strengths: evaluation.strengths.split('、').filter(s => s.trim()),
          improvements: evaluation.improvements.split('、').filter(s => s.trim()),
          recommendations: evaluation.feedback,
          summary: evaluation.feedback,
        },
      }

    } catch (error) {
      console.error('Coze agent evaluation error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'AI evaluation service unavailable'
      }, { status: 503 })
    }

    // 创建评估报告记录
    const evaluationReport = await prisma.evaluationReport.create({
      data: {
        interviewId,
        scores: JSON.stringify(evaluationData.scores),
        feedback: evaluationData.feedback.recommendations,
        strengths: evaluationData.feedback.strengths.join('、'),
        improvements: evaluationData.feedback.improvements.join('、'),
      },
    })

    // 更新面试状态为completed
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // 返回评估报告
    return NextResponse.json({ 
      success: true,
      data: evaluationData,
      evaluationReport,
      message: 'Evaluation report generated successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating evaluation:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate evaluation report'
    }, { status: 500 })
  }
}