import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 获取评估报告
    const evaluationReport = await prisma.evaluationReport.findFirst({
      where: { interviewId },
    })

    if (!evaluationReport) {
      return NextResponse.json({ 
        success: false,
        error: 'Evaluation report not found'
      }, { status: 404 })
    }

    // 构建返回的数据结构
    const evaluationData = {
      scores: JSON.parse(evaluationReport.scores),
      feedback: {
        strengths: evaluationReport.strengths ? evaluationReport.strengths.split('、').filter(s => s.trim()) : [],
        improvements: evaluationReport.improvements ? evaluationReport.improvements.split('、').filter(s => s.trim()) : [],
        recommendations: evaluationReport.feedback,
        summary: evaluationReport.feedback,
      },
    }

    return NextResponse.json({ 
      success: true,
      data: evaluationData,
      evaluationReport,
      message: 'Evaluation report retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching evaluation:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch evaluation report'
    }, { status: 500 })
  }
}