import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { CozeAgentService, Message } from '@/lib/coze-agent-service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // 获取请求体中的userId（支持临时用户）
    const body = await request.json()
    const { userId } = body || {}

    // 获取面试信息和消息历史
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: '面试不存在'
      }, { status: 404 })
    }

    // 检查权限：支持临时用户结束自己的面试
    let currentUserId = userId
    
    // 如果没有提供userId，尝试从session获取
    if (!currentUserId) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        currentUserId = session.user.id
      }
    }

    // 如果没有userId，返回错误
    if (!currentUserId) {
      return NextResponse.json({ 
        success: false,
        error: '用户ID不能为空'
      }, { status: 400 })
    }

    // 检查权限：只有面试创建者才能结束面试
    if (interview.userId !== currentUserId) {
      return NextResponse.json({ 
        success: false,
        error: '无权结束此面试'
      }, { status: 403 })
    }

    // 检查面试状态
    if (interview.status === 'completed') {
      return NextResponse.json({ 
        success: false,
        error: '面试已结束'
      }, { status: 400 })
    }

    // 计算面试时长（如果有开始时间）
    let duration = null
    if (interview.startedAt) {
      duration = Math.floor((new Date().getTime() - interview.startedAt.getTime()) / 1000)
    }

    // 更新面试状态
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        duration,
      },
    })

    // 生成评估报告
    let evaluationReport = null
    
    if (interview.messages.length > 0) {
      // 转换消息格式为Coze服务要求的格式
      const conversation: Message[] = interview.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
      }))

      // 使用Coze服务生成评估
      const cozeService = new CozeAgentService()
      const evaluation = await cozeService.generateEvaluation(
        interview.type as 'java' | 'web',
        conversation,
        `interview-${id}`
      )

      // 创建评估报告记录
      evaluationReport = await prisma.evaluationReport.create({
        data: {
          interviewId: id,
          scores: JSON.stringify(evaluation),
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
      })
    }

    return NextResponse.json({ 
      success: true,
      interview: updatedInterview,
      evaluation: evaluationReport,
      message: '面试已成功结束'
    })

  } catch (error) {
    console.error('Error completing interview:', error)
    return NextResponse.json({ 
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}