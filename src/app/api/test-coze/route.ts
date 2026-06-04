import { NextRequest, NextResponse } from 'next/server'
import { CozeAgentService, Message } from '@/lib/coze-agent-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'web', message = '你好' } = body

    // 创建Coze服务实例
    const cozeService = new CozeAgentService()
    
    // 准备测试消息
    const messages: Message[] = [
      { role: 'user', content: message }
    ]

    // 发送消息到智能体
    const response = await cozeService.sendMessage(type as 'java' | 'web', messages, `test-${Date.now()}`)

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Coze智能体测试成功'
    })

  } catch (error) {
    console.error('Coze测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: 'Coze智能体测试失败'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 创建Coze服务实例
    const cozeService = new CozeAgentService()
    
    // 检查配置
    const config = {
      apiKey: process.env.COZE_API_KEY ? '已配置' : '未配置',
      javaBotId: process.env.COZE_BOT_ID_JAVA ? '已配置' : '未配置',
      webBotId: process.env.COZE_BOT_ID_WEB ? '已配置' : '未配置'
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Coze服务配置检查成功'
    })

  } catch (error) {
    console.error('Coze配置检查失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: 'Coze服务配置检查失败'
    }, { status: 500 })
  }
}