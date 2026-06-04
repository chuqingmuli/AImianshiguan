import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    // 获取URL参数中的userId（支持临时用户）
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // 获取面试详情，包含消息历史和评估报告
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        evaluations: true,
        user: {
          select: {
            name: true,
            email: true,
            isTemporary: true,
          },
        },
      },
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: '面试不存在'
      }, { status: 404 })
    }

    // 检查权限：支持临时用户访问自己的面试
    let currentUserId = userId
    
    // 如果没有提供userId，尝试从session获取
    if (!currentUserId) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        currentUserId = session.user.id
      }
    }

    // 检查权限：只有面试创建者才能访问
    if (interview.userId !== currentUserId) {
      return NextResponse.json({ 
        success: false,
        error: '无权访问此面试'
      }, { status: 403 })
    }

    return NextResponse.json({ 
      success: true,
      data: interview,
    })

  } catch (error) {
    console.error('Error fetching interview:', error)
    return NextResponse.json({ 
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, startedAt, userId } = body

    // 验证必填参数
    if (!status || !userId) {
      return NextResponse.json({ 
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    // 检查面试是否存在且属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id,
        userId,
      },
    })

    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: '面试不存在或无权操作'
      }, { status: 404 })
    }

    // 更新面试状态
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        status,
        startedAt: startedAt ? new Date(startedAt) : undefined,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        evaluations: true,
      },
    })

    // 如果是从preparing状态变为active状态，发送开场白
    if (status === 'active' && interview.status === 'preparing') {
      // 根据面试类型选择不同的开场白
      let openingMessage = ''
      
      if (interview.type === 'web') {
        openingMessage = '你好，我是今天的 Web 前端技术面试官，刁工。为了我们能进行一次高效、有深度的技术交流，在开始前，请先发送你的个人简历。\n\n这能帮助我快速了解你的技术背景，从而将宝贵的面试时间集中在你最熟悉的前端技术栈和最有价值的项目经验上。\n\n简历建议包含：前端技术栈清单（如框架、工具、核心语言）、1-2 个核心项目描述（请说明你的角色、技术决策、挑战以及亮点），以及相关经历。\n\n收到简历后，我们的面试将围绕你的实际经历展开，涵盖项目深挖、前端原理探讨和场景设计。请放轻松，这更像是一次技术同行的深度复盘。\n\n请发送你的简历，我们随即开始。'
      } else {
        openingMessage = '你好，我是今天的 Java 技术面试官，陈工。为了我们能进行一次高效、有深度的技术交流，在开始前，请先发送你的个人简历。\n\n这能帮助我快速了解你的技术背景，从而将宝贵的面试时间集中在你最熟悉的技术栈和最有价值的项目经验上。\n\n简历建议包含：技术栈清单、1-2 个核心项目描述（请说明你的角色、技术决策和挑战），以及相关经历。\n\n收到简历后，我们的面试将围绕你的实际经历展开，涵盖项目深挖、技术原理探讨和场景设计。请放轻松，这更像是一次技术同行的深度复盘。\n\n请发送你的简历，我们随即开始。'
      }
      
      // 直接创建开场白消息记录
      await prisma.message.create({
        data: {
          interviewId: id,
          role: 'assistant',
          content: openingMessage,
          messageType: 'text',
        },
      })
      
      console.log('=== 调试：发送开场白成功 ===')
      console.log('开场白内容:', openingMessage)
      console.log('==========================')
    }

    return NextResponse.json({ 
      success: true,
      data: updatedInterview,
    })

  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json({ 
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}