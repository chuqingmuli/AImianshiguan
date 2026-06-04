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
    const { content, fileUrl, parsedData } = body

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        content,
        fileUrl,
        parsedData: parsedData ? JSON.stringify(parsedData) : null,
      },
    })

    return NextResponse.json(resume, { status: 201 })
  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}