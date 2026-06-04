import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { CozeAgentService, Message as CozeMessage } from '@/lib/coze-agent-service'

// 输入验证schema
const createMessageSchema = z.object({
  interviewId: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(5000),
  audioUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized'
    }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsedData = createMessageSchema.parse(body)

    // 验证面试是否属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: parsedData.interviewId,
        userId: session.user.id,
      },
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }

    // 如果面试状态是preparing，自动更新为active
    if (interview.status === 'preparing') {
      await prisma.interview.update({
        where: { id: parsedData.interviewId },
        data: { 
          status: 'active',
          startedAt: new Date(),
        },
      })
    }

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        interviewId: parsedData.interviewId,
        role: parsedData.role,
        content: parsedData.content,
        audioUrl: parsedData.audioUrl,
      },
    })

    // 如果是用户消息，获取智能体回复
    let agentMessage = null
    if (parsedData.role === 'user') {
      // 获取完整对话历史
      const conversation = await prisma.message.findMany({
        where: { interviewId: parsedData.interviewId },
        orderBy: { timestamp: 'asc' },
      })

      // 转换为Coze服务要求的格式
      const cozeMessages: CozeMessage[] = conversation.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      // 使用Coze服务获取回复
      const cozeService = new CozeAgentService()
      const agentResponse = await cozeService.sendMessage(
        interview.type as 'java' | 'web',
        cozeMessages,
        `interview-${parsedData.interviewId}`
      )

      // 保存智能体回复
      agentMessage = await prisma.message.create({
        data: {
          interviewId: parsedData.interviewId,
          role: 'assistant',
          content: agentResponse.content,
          audioUrl: agentResponse.audio_url,
        },
      })
    }

    return NextResponse.json({ 
      success: true,
      message: userMessage,
      agentMessage: agentMessage,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ 
      success: false,
      error: 'Unauthorized'
    }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json({ 
        success: false,
        error: 'Interview ID is required'
      }, { status: 400 })
    }

    // 验证面试是否属于当前用户
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

    const messages = await prisma.message.findMany({
      where: { interviewId },
      orderBy: { timestamp: 'asc' },
    })

    return NextResponse.json({ 
      success: true,
      data: messages,
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}