import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// 输入验证schema
const createInterviewSchema = z.object({
  type: z.enum(['java', 'web']),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
})

// 查询参数schema
const interviewsQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['java', 'web']).optional(),
  status: z.enum(['preparing', 'active', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
})

// 获取用户面试列表（支持临时用户）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = interviewsQuerySchema.parse({
      userId: searchParams.get('userId'),
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    })

    // 获取用户ID（支持临时用户）
    let userId = queryParams.userId
    
    // 如果没有提供userId，尝试从session获取
    if (!userId) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        userId = session.user.id
      }
    }

    // 如果没有userId，返回错误
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '用户ID不能为空'
      }, { status: 400 })
    }

    // 构建查询条件
    const where = {
      userId,
      ...(queryParams.type && { type: queryParams.type }),
      ...(queryParams.status && { status: queryParams.status }),
    }

    // 获取总数
    const total = await prisma.interview.count({ where })

    // 获取分页数据
    const interviews = await prisma.interview.findMany({
      where,
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 5, // 只返回最近5条消息
        },
        evaluations: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (queryParams.page - 1) * queryParams.pageSize,
      take: queryParams.pageSize,
    })

    return NextResponse.json({
      success: true,
      data: interviews,
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        total,
        totalPages: Math.ceil(total / queryParams.pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof z.ZodError ? '输入参数无效' : '服务器内部错误'
    }, { status: 500 })
  }
}

// 创建新面试（支持临时用户）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 更新验证schema以支持userId参数
    const createInterviewSchemaWithUser = z.object({
      type: z.enum(['java', 'web']),
      userId: z.string().optional(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
    })
    
    const parsedData = createInterviewSchemaWithUser.parse(body)

    // 获取用户ID（支持临时用户）
    let userId = parsedData.userId
    
    // 如果没有提供userId，尝试从session获取
    if (!userId) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        userId = session.user.id
      }
    }

    // 检查用户是否存在，如果不存在或没有userId，创建临时用户
    if (!userId) {
      const tempUser = await prisma.user.create({
        data: {
          email: `temp_${Date.now()}@codecanvas.dev`,
          name: '临时用户',
          isTemporary: true,
        },
      })
      userId = tempUser.id
    } else {
      // 检查提供的userId是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })
      
      if (!existingUser) {
        // 用户不存在，创建临时用户
        const tempUser = await prisma.user.create({
          data: {
            email: `temp_${Date.now()}@codecanvas.dev`,
            name: '临时用户',
            isTemporary: true,
          },
        })
        userId = tempUser.id
      }
    }

    // 生成会话ID
    const sessionId = uuidv4()

    const interview = await prisma.interview.create({
      data: {
        userId,
        type: parsedData.type,
        status: 'preparing',
        title: parsedData.title || `${parsedData.type === 'java' ? 'Java' : 'Web前端'}面试 ${new Date().toLocaleDateString()}`,
        description: parsedData.description,
        sessionId,
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({ 
      success: true,
      interview,
      sessionId,
      message: '面试创建成功'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof z.ZodError ? '输入参数无效' : '服务器内部错误'
    }, { status: 500 })
  }
}