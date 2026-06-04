import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { interviewId, scores, feedback, strengths, improvements } = body

    // 验证面试是否属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId: session.user.id,
      },
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const evaluation = await prisma.evaluationReport.create({
      data: {
        interviewId,
        scores: JSON.stringify(scores),
        feedback,
        strengths,
        improvements,
      },
    })

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')

    if (interviewId) {
      // 获取特定面试的评估报告
      const evaluation = await prisma.evaluationReport.findFirst({
        where: { 
          interviewId,
          interview: { userId: session.user.id },
        },
      })
      return NextResponse.json(evaluation || null)
    } else {
      // 获取用户所有评估报告
      const evaluations = await prisma.evaluationReport.findMany({
        where: {
          interview: { userId: session.user.id },
        },
        include: {
          interview: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              completedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(evaluations)
    }
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}