import { CozeAPI, COZE_CN_BASE_URL } from '@coze/api'
import appConfig from '@/config/config'
import axios from 'axios'
import FormData from 'form-data'

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant'
  content: string
  content_type?: string
  type?: string
  timestamp?: Date
}

// 智能体响应类型
export interface AgentResponse {
  content: string
  messageId: string
  sessionId: string
  timestamp: Date
  audio_url?: string
  metadata?: Record<string, any>
}

// 评估数据类型
export interface EvaluationData {
  technical: number
  communication: number
  problemSolving: number
  knowledgeDepth: number
  overall: number
  strengths: string
  improvements: string
  feedback: string
}

// Coze API配置接口
interface CozeConfig {
  apiKey: string
  botIds: {
    java: string
    web: string
  }
  apiUrl?: string
  timeout?: number
  retryCount?: number
}



export class CozeAgentService {
  private config: CozeConfig
  private cozeClient: CozeAPI

  constructor(config?: Partial<CozeConfig>) {
    this.config = {
      apiKey: config?.apiKey || appConfig.coze.apiKey || '',
      botIds: {
        java: config?.botIds?.java || appConfig.coze.botIds.java || '',
        web: config?.botIds?.web || appConfig.coze.botIds.web || '',
      },
      timeout: 30000,
      retryCount: 3,
      ...config,
    }

    // 初始化Coze客户端
    this.cozeClient = new CozeAPI({
      token: this.config.apiKey,
      baseURL: COZE_CN_BASE_URL,
    })
  }

  /**
   * 上传音频文件到Coze并获取file_id
   * @param audioBuffer 音频文件的Buffer
   * @param fileName 文件名
   * @returns 文件ID
   */
  async uploadAudioFile(audioBuffer: Buffer, fileName: string): Promise<string> {
    try {
      // 使用axios直接调用Coze文件上传API
      const formData = new FormData()
      
      // 获取文件扩展名
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'wav'
      
      // 设置正确的contentType
      const contentType = fileExtension === 'wav' ? 'audio/wav' : 
                         fileExtension === 'mp3' ? 'audio/mpeg' : 
                         fileExtension === 'ogg' ? 'audio/ogg' : 'audio/webm'
      
      formData.append('file', audioBuffer, {
        filename: fileName,
        contentType: contentType
      })
      
      const response = await axios.post('https://api.coze.cn/v1/files/upload', formData, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      console.log('音频文件上传响应:', response.data)
      
      // 检查响应是否成功
      console.log('Coze API响应:', response.data)
      
      // 检查响应数据
      if (!response.data || !response.data.data || !response.data.data.id) {
        throw new Error('Coze API返回的数据格式不正确')
      }
      
      return response.data.data.id
    } catch (error) {
      console.error('音频文件上传失败:', error)
      throw error
    }
  }

  /**
   * 发送消息到指定智能体
   * @param type 智能体类型 ('java' | 'web')
   * @param messages 对话历史
   * @param sessionId 会话ID
   * @returns 智能体响应
   */
  async sendMessage(type: 'java' | 'web', messages: Message[], sessionId: string): Promise<AgentResponse>{
    try {
      const botId = this.config.botIds[type]
      if (!botId) {
        throw new Error(`Bot ID not configured for ${type} agent`)
      }

      // 格式化消息为Coze SDK格式
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        content_type: msg.content_type || "text",
        type: msg.type || (msg.role === 'user' ? "question" : "answer")
      }))

      // 使用Coze SDK流式发送消息，添加语音配置
      const response = await this.cozeClient.chat.stream({
        bot_id: botId,
        user_id: sessionId,
        stream: true,
        additional_messages: formattedMessages,
        voice: 'zh_female_xiaoxiao' // 使用晓晓女声
      })

      // 收集流式响应
      let fullContent = ''
      let messageId = ''
      let audioUrl = ''
      
      console.log('开始接收流式响应...')
      let chunkCount = 0
      
      for await (const chunk of response) {
        chunkCount++
        console.log(`收到第${chunkCount}个数据块:`, chunk)
        
        if (chunk.event === 'conversation.message.delta') {
          console.log('收到delta内容:', chunk.data.content)
          fullContent += chunk.data.content
        } else if (chunk.event === 'conversation.message.completed') {
          console.log('收到completed消息ID:', chunk.data.id)
          messageId = chunk.data.id
          // 检查是否包含音频URL
          if (chunk.data.audio_url) {
            audioUrl = chunk.data.audio_url
            console.log('收到音频URL:', audioUrl)
          }
        } else if (chunk.event === 'done') {
          console.log('流式响应结束')
        }
      }
      
      console.log('流式响应处理完成，总内容:', fullContent)
      console.log('消息ID:', messageId)
      console.log('音频URL:', audioUrl)

      if (!fullContent) {
        throw new Error('Empty response from Coze agent')
      }

      return {
        content: fullContent,
        messageId: messageId || `msg_${Date.now()}`,
        sessionId,
        timestamp: new Date(),
        audio_url: audioUrl,
        metadata: {}
      }
    } catch (error) {
      console.error('Error sending message to Coze agent:', error)
      throw error
    }
  }

  /**
   * 生成面试评估报告
   * @param type 智能体类型 ('java' | 'web')
   * @param conversation 完整对话历史
   * @param sessionId 会话ID
   * @returns 评估数据
   */
  async generateEvaluation(type: 'java' | 'web', conversation: Message[], sessionId: string): Promise<EvaluationData> {
    const evaluationPrompt = this.generateEvaluationPrompt(type, conversation)
    const evaluationMessage: Message = {
      role: 'user',
      content: evaluationPrompt,
    }

    const response = await this.sendMessage(type, [...conversation, evaluationMessage], sessionId)
    return this.parseEvaluationResponse(response.content)
  }

  /**
   * 生成评估提示词
   */
  private generateEvaluationPrompt(type: 'java' | 'web', conversation: Message[]): string {
    const role = type === 'java' ? 'Java' : 'Web前端'
    const conversationText = conversation
      .map(msg => `${msg.role === 'user' ? '候选人' : '面试官'}: ${msg.content}`)
      .join('\n\n')

    return `请根据以下${role}面试对话历史，生成一份详细的面试评估报告。评估应包括：

1. 技术能力评分（1-10分）
2. 沟通表达能力评分（1-10分）
3. 问题解决能力评分（1-10分）
4. 知识深度评分（1-10分）
5. 综合评分（1-10分）
6. 候选人的优势
7. 需要改进的地方
8. 总体评价和建议

请以JSON格式返回，包含以下字段：
{
  "technical": number,
  "communication": number,
  "problemSolving": number,
  "knowledgeDepth": number,
  "overall": number,
  "strengths": string,
  "improvements": string,
  "feedback": string
}

面试对话历史：
${conversationText}`
  }

  /**
   * 解析评估响应
   */
  private parseEvaluationResponse(content: string): EvaluationData {
    // 尝试提取JSON内容
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // 如果没有找到JSON，抛出错误
    throw new Error('No JSON found in evaluation response')
  }


}