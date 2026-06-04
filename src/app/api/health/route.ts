import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接
    // 这里可以添加数据库健康检查逻辑
    
    return NextResponse.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      error: 'Service unavailable'
    }, { status: 503 })
  }
}