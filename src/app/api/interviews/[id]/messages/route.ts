import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// 轮询任务结果的辅助函数
async function pollCozeTaskResult(conversationId: string, chatId: string, apiKey: string, maxAttempts = 60, intervalMs = 2000) {
  for (let i = 0; i< maxAttempts; i++) {
    await new Promise(resolve =>setTimeout(resolve, intervalMs));
    
    try {
      const response = await fetch(`https://api.coze.cn/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`轮询请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        if (data.data.status === 'completed') {
          // 任务完成，调用消息详情接口获取回复
          console.log(`✅ 任务完成，调用消息详情接口获取回复`);
          const messagesResponse = await fetch(`https://api.coze.cn/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!messagesResponse.ok) {
            throw new Error(`获取消息详情失败: ${messagesResponse.status}`);
          }
          
          const messagesData = await messagesResponse.json();
          
          if (messagesData.code === 0 && messagesData.data) {
            console.log(`📋 完整响应数据结构:`, JSON.stringify(messagesData.data, null, 2));
            
            // 查找智能体回复（type为answer的消息）
            const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant' && msg.type === 'answer');
            
            if (assistantMessages.length >0) {
              console.log(`🎉 找到智能体回复`);
              console.log(`📝 消息详细信息:`, JSON.stringify(assistantMessages[0], null, 2));
              
              const content = assistantMessages[0].content;
              const audioUrl = assistantMessages[0].audio_url || assistantMessages[0].audioUrl || '';
              console.log(`🎵 音频URL: ${audioUrl}`);
              return { content, audioUrl };
            } else {
              console.log(`⚠️  未找到智能体回复`);
              return { content: '您好，我是面试助手。请继续提问，我会尽力回答您的问题。', audioUrl: '' };
            }
          } else {
            throw new Error(`获取消息详情API错误: ${messagesData.msg}`);
          }
        } else if (data.data.status === 'failed') {
          throw new Error(`智能体任务执行失败: ${data.data.last_error?.msg || '未知错误'}`);
        }
        console.log(`轮询中 (${i + 1}/${maxAttempts}) - 任务状态: ${data.data.status}`);
      } else {
        throw new Error(`Coze API错误: ${data.msg}`);
      }
    } catch (error) {
      console.error(`第${i + 1}次轮询失败:`, error);
    }
  }
  
  throw new Error('轮询超时，未能获取智能体回复');
}

// 调用智能体的主函数
async function callCozeAgent(userMessage: string, interviewId: string, interviewType: 'java' | 'web', metadata?: any) {
  const apiKey = process.env.COZE_API_KEY!;
  const botId = interviewType === 'java' ? process.env.COZE_BOT_ID_JAVA! : process.env.COZE_BOT_ID_WEB!;
  
  console.log(`🤖 调用Coze智能体，用户消息: "${userMessage.substring(0, 50)}..."`);
  
  try {
    // 创建对话任务，添加语音配置
    const createResponse = await fetch('https://api.coze.cn/v3/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          bot_id: botId,
          user_id: interviewId,
          additional_messages: [
            {
              role: 'user',
              content: `你现在是一个真实的面试官，请使用口语化的中文，多用语气词，每句话不要太长，保持对话节奏。\n\n${userMessage}`,
              content_type: 'text',
              type: 'question'
            }
          ],
          stream: false,
          auto_save_history: true,
          voice: 'zh_female_xiaoxiao' // 使用晓晓女声
        }),
    });
    
    console.log(`📡 Coze API响应状态: ${createResponse.status}`);
    
    if (!createResponse.ok) {
      throw new Error(`创建任务失败: ${createResponse.status}`);
    }
    
    const createData = await createResponse.json();
    console.log(`📋 Coze API完整响应:`, JSON.stringify(createData, null, 2));
    
    if (createData.code !== 0) {
      throw new Error(`API错误: ${createData.msg}`);
    }
    
    const taskId = createData.data?.id;
    const conversationId = createData.data?.conversation_id;
    const status = createData.data?.status;
    
    console.log(`📊 任务创建成功，ID: ${taskId}, 状态: ${status}, 会话ID: ${conversationId}`);
    
    if (status === 'completed') {
      const content = createData.data?.content || '任务完成，但无回复内容';
      const audioUrl = createData.data?.audio_url || '';
      console.log(`✅ 任务已完成，内容: "${content.substring(0, 100)}..."`);
      console.log(`🎵 音频URL: ${audioUrl}`);
      return { content, audioUrl };
    } else {
      console.log(`🔄 开始轮询任务结果，任务ID: ${taskId}`);
      const aiReply = await pollCozeTaskResult(conversationId, taskId, apiKey);
      return aiReply;
    }
    
  } catch (error) {
    console.error('❌ 调用智能体失败:', error);
    return `[智能体调用失败] ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    let userId: string | undefined
    
    // 检查请求类型
    const contentType = request.headers.get('content-type')
    
    let content: string
    let isAudio = false
    
    let metadata = null
    
    if (contentType?.includes('multipart/form-data')) {
      // 处理表单数据（可能包含音频文件）
      const formData = await request.formData()
      userId = formData.get('userId') as string
      content = formData.get('content') as string
      isAudio = formData.get('isAudio') === 'true'
    } else {
      // 处理JSON请求
      const body = await request.json()
      content = body.content
      isAudio = body.isAudio || false
      userId = body.userId
      metadata = body.metadata || null
    }
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }
    
    console.log(`📨 收到消息，面试ID: ${interviewId}, 类型: ${isAudio ? '语音' : '文本'}, 内容: "${content.substring(0, 100)}..."`);
    
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
    
    // 验证面试是否存在且属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId,
      },
    })
    
    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: '面试不存在'
      }, { status: 404 })
    }
    
    // 验证面试状态
    if (interview.status !== 'active') {
      return NextResponse.json({ 
        success: false,
        error: '面试未处于活跃状态'
      }, { status: 400 })
    }
    
    // 创建用户消息记录
    const userMessage = await prisma.message.create({
      data: {
        interviewId,
        role: 'user',
        content,
        messageType: isAudio ? 'audio' : 'text',
      },
    })
    
    // 调用智能体
    const aiResponse = await callCozeAgent(content, interviewId, interview.type as 'java' | 'web', metadata)

    // 处理AI响应（可能是字符串或对象）
    let aiContent = ''
    let aiAudioUrl = ''
    
    if (typeof aiResponse === 'string') {
      aiContent = aiResponse
    } else {
      aiContent = aiResponse.content || ''
      aiAudioUrl = aiResponse.audioUrl || ''
    }

    // 创建助理消息记录
    const assistantMessage = await prisma.message.create({
      data: {
        interviewId,
        role: 'assistant',
        content: aiContent,
        audioUrl: aiAudioUrl,
        messageType: 'text',
      },
    })
    
    // 返回消息对
    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        assistantMessage
      }
    });
    
  } catch (error: any) {
    console.error('❌ API路由错误:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '服务器内部错误',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: interviewId } = params
    
    // 解析查询参数（支持临时用户和分页）
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    
    // 如果没有提供userId，尝试从session获取
    let currentUserId = userId
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
    
    // 验证面试是否存在且属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId: currentUserId,
      },
    })
    
    if (!interview) {
      return NextResponse.json({ 
        success: false,
        error: '面试不存在'
      }, { status: 404 })
    }
    
    // 获取消息总数
    const total = await prisma.message.count({
      where: { interviewId },
    })
    
    // 获取分页消息数据（按时间正序排列）
    const messages = await prisma.message.findMany({
      where: { interviewId },
      orderBy: { timestamp: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    
    return NextResponse.json({ 
      success: true,
      data: messages,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      message: '消息获取成功'
    })
    
  } catch (error) {
    console.error('Error fetching messages:', error)
    
    return NextResponse.json({ 
      success: false,
      error: '服务器内部错误',
      message: '获取消息失败'
    }, { status: 500 })
  }
}
