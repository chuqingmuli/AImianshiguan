import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import prisma from '@/lib/prisma'

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
            // 查找智能体回复（type为answer的消息）
            const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant' && msg.type === 'answer');
            
            if (assistantMessages.length >0) {
              console.log(`🎉 找到智能体回复`);
              return assistantMessages[0].content;
            } else {
              console.log(`⚠️  未找到智能体回复`);
              return '您好，我是面试助手。请继续提问，我会尽力回答您的问题。';
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
async function callCozeAgent(userMessage: string, interviewId: string, interviewType: 'java' | 'web') {
  const apiKey = process.env.COZE_API_KEY!;
  const botId = interviewType === 'java' ? process.env.COZE_BOT_ID_JAVA! : process.env.COZE_BOT_ID_WEB!;
  
  console.log(`🤖 调用Coze智能体，用户消息: "${userMessage.substring(0, 50)}..."`);
  
  try {
    // 创建对话任务
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
            content: userMessage,
            content_type: 'text',
            type: 'question'
          }
        ],
        stream: false,
        auto_save_history: true
      }),
    });
    
    if (!createResponse.ok) {
      throw new Error(`创建任务失败: ${createResponse.status}`);
    }
    
    const createData = await createResponse.json();
    
    if (createData.code !== 0) {
      throw new Error(`API错误: ${createData.msg}`);
    }
    
    const taskId = createData.data?.id;
    const conversationId = createData.data?.conversation_id;
    const status = createData.data?.status;
    
    console.log(`📊 任务创建成功，ID: ${taskId}, 状态: ${status}, 会话ID: ${conversationId}`);
    
    if (status === 'completed') {
      return createData.data?.content || '任务完成，但无回复内容';
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: interviewId } = params
    const formData = await request.formData()
    const audioFile = formData.get('audio_file') as File
    const userId = formData.get('userId') as string
    
    if (!audioFile) {
      return NextResponse.json({ error: '音频文件不能为空' }, { status: 400 })
    }

    // 验证面试是否存在且属于当前用户
    const interview = await prisma.interview.findFirst({
      where: { 
        id: interviewId,
        userId,
      },
    })

    if (!interview) {
      return NextResponse.json({ error: '面试不存在' }, { status: 404 })
    }

    // 验证面试状态
    if (interview.status !== 'active') {
      return NextResponse.json({ error: '面试未处于活跃状态' }, { status: 400 })
    }

    // 1. 调用本地ASR服务进行语音转文本
    const asrFormData = new FormData()
    asrFormData.append('audio_file', audioFile)
    
    const asrResponse = await axios.post('http://localhost:9001/asr', asrFormData)

    const transcription = asrResponse.data.text
    console.log('语音识别结果:', transcription)

    if (!transcription || transcription.trim() === '') {
      return NextResponse.json({ error: '语音识别失败，未识别到内容' }, { status: 400 })
    }

    // 创建用户消息记录
    const userMessage = await prisma.message.create({
      data: {
        interviewId,
        role: 'user',
        content: transcription,
        messageType: 'text',
      },
    })

    // 2. 调用Coze智能体处理文本
    const aiResponse = await callCozeAgent(transcription, interviewId, interview.type)

    // 创建助理消息记录
    const assistantMessage = await prisma.message.create({
      data: {
        interviewId,
        role: 'assistant',
        content: aiResponse,
        messageType: 'text',
      },
    })

    // 3. 返回处理结果
    return NextResponse.json({
      data: {
        userMessage,
        assistantMessage
      }
    })

  } catch (error) {
    console.error('语音消息处理失败:', error)
    return NextResponse.json({ error: '语音消息处理失败' }, { status: 500 })
  }
}
