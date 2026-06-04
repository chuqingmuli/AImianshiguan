import axios from 'axios'

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

// 智能体响应类型
export interface AgentResponse {
  content: string
  tokensUsed?: number
  finishReason?: string
}

// 评估数据类型
export interface EvaluationData {
  scores: Record<string, number>
  feedback: {
    strengths: string[]
    improvements: string[]
    recommendations: string
    summary: string
  }
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

// Coze API消息格式
interface CozeMessage {
  role: 'user' | 'assistant'
  content: string
}

// Coze API请求体
interface CozeRequest {
  bot_id: string
  messages: CozeMessage[]
  stream?: boolean
  session_id?: string
}

// Coze API响应格式
interface CozeResponse {
  code: number
  msg: string
  data: {
    id: string
    content: string
    session_id: string
    metadata?: Record<string, any>
  }
}

/**
 * Coze智能体服务客户端
 * 用于与Coze AI平台进行交互，支持发送消息和生成评估报告
 */
export class CozeAgentService {
  private config: CozeConfig
  private axiosInstance: any

  /**
   * 构造函数
   * @param config 配置参数（可选）
   */
  constructor(config?: Partial<CozeConfig>) {
    // 从环境变量读取配置，支持自定义配置覆盖
    this.config = {
      apiKey: config?.apiKey || process.env.COZE_API_KEY || '',
      botIds: {
        java: config?.botIds?.java || process.env.COZE_BOT_ID_JAVA || '',
        web: config?.botIds?.web || process.env.COZE_BOT_ID_WEB || '',
      },
      apiUrl: config?.apiUrl || 'https://api.coze.cn/v3/chat',
      timeout: config?.timeout || 30000,
      retryCount: config?.retryCount || 3,
      ...config,
    }

    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * 发送消息到指定智能体
   * @param type 智能体类型 ('java' | 'web')
   * @param messages 对话历史
   * @param sessionId 会话ID
   * @returns 智能体响应
   */
  async sendMessage(type: 'java' | 'web', messages: Message[], sessionId: string): Promise<AgentResponse> {
    try {
      // 验证配置
      if (!this.config.apiKey || !this.config.botIds[type]) {
        console.warn('Coze API配置不完整，使用模拟回复')
        return this.getMockResponse(type, messages, sessionId)
      }

      // 格式化消息为Coze API要求的格式
      const formattedMessages = this.formatMessages(messages)
      
      // 发送请求并处理重试
      const response = await this.makeRequestWithRetry(
        this.config.botIds[type],
        formattedMessages,
        sessionId
      )

      // 返回格式化的响应
      return {
        content: response.data.content,
        tokensUsed: response.data.metadata?.tokens_used,
        finishReason: response.data.metadata?.finish_reason || 'normal',
      }
    } catch (error) {
      console.error('发送消息到Coze智能体失败:', error)
      // 降级到模拟回复
      return this.getMockResponse(type, messages, sessionId)
    }
  }

  /**
   * 生成面试评估报告
   * @param type 智能体类型 ('java' | 'web')
   * @param conversation 完整对话历史
   * @returns 评估数据
   */
  async generateEvaluation(type: 'java' | 'web', conversation: Message[]): Promise<EvaluationData> {
    try {
      // 验证配置
      if (!this.config.apiKey || !this.config.botIds[type]) {
        console.warn('Coze API配置不完整，使用模拟评估')
        return this.getMockEvaluation(type, conversation)
      }

      // 生成评估提示词
      const evaluationPrompt = this.generateEvaluationPrompt(type, conversation)
      const evaluationMessage: Message = {
        role: 'user',
        content: evaluationPrompt,
      }

      // 发送评估请求
      const response = await this.sendMessage(type, [...conversation, evaluationMessage], `evaluation-${Date.now()}`)
      
      // 解析评估响应
      return this.parseEvaluationResponse(response.content)
    } catch (error) {
      console.error('生成评估报告失败:', error)
      // 降级到模拟评估
      return this.getMockEvaluation(type, conversation)
    }
  }

  /**
   * 格式化消息为Coze API格式
   * @param messages 原始消息数组
   * @returns 格式化后的消息数组
   */
  private formatMessages(messages: Message[]): CozeMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
  }

  /**
   * 发送请求并处理重试逻辑
   * @param botId 智能体ID
   * @param messages 格式化后的消息
   * @param sessionId 会话ID
   * @returns Coze API响应
   */
  private async makeRequestWithRetry(botId: string, messages: CozeMessage[], sessionId: string): Promise<CozeResponse> {
    let lastError: Error | null = null
    const retryCount = this.config.retryCount || 3

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const requestBody: CozeRequest = {
          bot_id: botId,
          messages,
          stream: false,
          session_id: sessionId,
        }

        const response = await this.axiosInstance.post('', requestBody)
        
        if (response.data.code === 0) {
          return response.data
        } else {
          throw new Error(response.data.msg || 'API请求失败')
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === retryCount) {
          throw lastError
        }

        // 指数退避重试（1s, 2s, 4s...）
        const delay = 1000 * Math.pow(2, attempt - 1)
        console.warn(`请求失败，${delay}ms后重试 (${attempt}/${retryCount})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('重试多次后请求仍然失败')
  }

  /**
   * 生成评估提示词
   * @param type 智能体类型
   * @param conversation 对话历史
   * @returns 评估提示词
   */
  private generateEvaluationPrompt(type: 'java' | 'web', conversation: Message[]): string {
    const role = type === 'java' ? 'Java' : 'Web前端'
    const conversationText = conversation
      .map(msg => `${msg.role === 'user' ? '候选人' : '面试官'}: ${msg.content}`)
      .join('\n\n')

    return `请根据以下${role}面试对话历史，生成一份详细的面试评估报告。

评估要求：
1. 技术能力评分（1-10分）
2. 沟通表达能力评分（1-10分）
3. 问题解决能力评分（1-10分）
4. 知识深度评分（1-10分）
5. 综合评分（1-10分）
6. 候选人的优势（数组形式）
7. 需要改进的地方（数组形式）
8. 具体建议和推荐
9. 总体评价总结

请严格按照以下JSON格式返回：
{
  "scores": {
    "technical": number,
    "communication": number,
    "problemSolving": number,
    "knowledgeDepth": number,
    "overall": number
  },
  "feedback": {
    "strengths": ["优势1", "优势2", "优势3"],
    "improvements": ["改进点1", "改进点2", "改进点3"],
    "recommendations": "具体建议和推荐内容",
    "summary": "总体评价总结"
  }
}

面试对话历史：
${conversationText}`
  }

  /**
   * 解析评估响应
   * @param content 响应内容
   * @returns 评估数据
   */
  private parseEvaluationResponse(content: string): EvaluationData {
    try {
      // 尝试提取JSON内容（处理可能的markdown格式）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // 验证必需字段
        if (parsed.scores && parsed.feedback) {
          return parsed
        }
      }
      
      throw new Error('响应中未找到有效的评估数据')
    } catch (error) {
      console.error('解析评估响应失败:', error)
      throw error
    }
  }

  /**
   * 获取模拟响应（API调用失败时使用）
   * @param type 智能体类型
   * @param messages 对话历史
   * @param sessionId 会话ID
   * @returns 模拟响应
   */
  private getMockResponse(type: 'java' | 'web', messages: Message[], sessionId: string): AgentResponse {
    const lastMessage = messages[messages.length - 1]
    const role = type === 'java' ? 'Java' : 'Web前端'
    
    let mockContent = ''
    
    // 根据用户输入生成智能的模拟回复
    if (!lastMessage) {
      mockContent = `你好！我是${role}面试官。请开始你的自我介绍。`
    } else if (lastMessage.content.includes('你好') || lastMessage.content.includes('hi') || lastMessage.content.includes('hello')) {
      mockContent = `你好！欢迎参加${role}技术面试。我是你的AI面试官，请简单介绍一下你的技术背景和项目经验。`
    } else if (lastMessage.content.includes('介绍') || lastMessage.content.includes('背景') || lastMessage.content.includes('经验')) {
      mockContent = `很好的自我介绍！接下来我想了解一下你对${role}核心概念的理解。请解释一下${type === 'java' ? 'Java中的多线程和并发编程' : '前端中的React Hooks和组件生命周期'}。`
    } else if (lastMessage.content.includes('多线程') || lastMessage.content.includes('并发')) {
      mockContent = `Java多线程是指在一个Java程序中同时执行多个线程。核心概念包括：线程创建（Thread类和Runnable接口）、线程状态（新建、就绪、运行、阻塞、死亡）、线程同步（synchronized关键字、Lock接口）、线程通信（wait/notify机制）、线程池等。请分享一下你在实际项目中如何使用多线程解决具体问题？`
    } else if (lastMessage.content.includes('React') || lastMessage.content.includes('hook')) {
      mockContent = `React Hooks是React 16.8版本引入的特性，允许在函数组件中使用状态和其他React特性。常用的Hooks包括useState（状态管理）、useEffect（副作用处理）、useContext（上下文）、useReducer（复杂状态管理）等。请解释一下useEffect的执行时机和依赖数组的作用。`
    } else if (lastMessage.content.includes('框架') || lastMessage.content.includes('Spring') || lastMessage.content.includes('Vue')) {
      if (type === 'java') {
        mockContent = `Spring Boot是一个快速开发框架，它简化了Spring应用的配置和部署。核心特性包括自动配置、内嵌服务器、starter依赖等。请介绍一下你使用Spring Boot开发的项目架构和关键组件。`
      } else {
        mockContent = `Vue.js是一个渐进式JavaScript框架，核心特性包括响应式数据绑定、组件化开发、虚拟DOM等。请比较Vue和React的异同，以及你在项目中选择框架的考量因素。`
      }
    } else if (lastMessage.content.includes('数据库') || lastMessage.content.includes('SQL') || lastMessage.content.includes('MySQL')) {
      mockContent = `数据库设计和优化是开发中的重要环节。请分享一下你对数据库索引、事务、锁机制的理解，以及在项目中如何进行数据库性能优化。`
    } else if (lastMessage.content.includes('性能') || lastMessage.content.includes('优化')) {
      if (type === 'java') {
        mockContent = `Java应用性能优化包括多个方面：JVM调优（内存分配、垃圾回收）、数据库优化（索引、查询优化）、代码优化（算法复杂度、并发处理）等。请介绍一个你参与的性能优化案例。`
      } else {
        mockContent = `前端性能优化包括：减少HTTP请求（合并文件、使用CDN）、优化资源加载（压缩、懒加载）、渲染优化（减少DOM操作、使用虚拟列表）、缓存策略等。请分享你的性能优化经验。`
      }
    } else if (lastMessage.content.includes('项目') || lastMessage.content.includes('经验')) {
      mockContent = `从你的项目描述来看，你在${role}开发方面有一定经验。接下来我想了解一下你在团队协作、技术选型、问题排查等方面的能力。请分享一个你遇到的技术难题以及解决过程。`
    } else {
      mockContent = `感谢你的回答。你的思路很清晰，技术理解也比较到位。接下来我想深入了解一下你在${type === 'java' ? '微服务架构' : '前端工程化'}方面的经验和理解。`
    }

    return {
      content: mockContent,
      tokensUsed: Math.floor(mockContent.length / 4), // 估算token使用量
      finishReason: 'stop',
    }
  }

  /**
   * 获取模拟评估（API调用失败时使用）
   * @param type 智能体类型
   * @param conversation 对话历史
   * @returns 模拟评估数据
   */
  private getMockEvaluation(type: 'java' | 'web', conversation: Message[]): EvaluationData {
    const role = type === 'java' ? 'Java' : 'Web前端'
    const messageCount = conversation.length
    
    // 根据对话长度和内容生成更智能的评分
    let baseScore = 7
    if (messageCount > 20) baseScore = 8
    if (messageCount < 10) baseScore = 6

    // 分析对话内容，调整评分
    const hasTechnicalDepth = conversation.some(msg => 
      msg.content.includes('原理') || 
      msg.content.includes('底层') || 
      msg.content.includes('源码') ||
      msg.content.includes('设计模式')
    )
    
    const hasProjectExperience = conversation.some(msg => 
      msg.content.includes('项目') || 
      msg.content.includes('开发') || 
      msg.content.includes('实现')
    )

    const technicalScore = hasTechnicalDepth ? baseScore + 1 : baseScore
    const communicationScore = conversation.length > 15 ? baseScore + 0.5 : baseScore

    return {
      scores: {
        technical: parseFloat(technicalScore.toFixed(1)),
        communication: parseFloat(communicationScore.toFixed(1)),
        problemSolving: parseFloat((baseScore - 0.5 + Math.random()).toFixed(1)),
        knowledgeDepth: parseFloat((baseScore + Math.random() * 1.5).toFixed(1)),
        overall: parseFloat((baseScore + Math.random()).toFixed(1)),
      },
      feedback: {
        strengths: [
          `${role}基础知识扎实，概念理解清晰`,
          '沟通表达流畅，能够清晰阐述技术观点',
          '问题分析思路明确，逻辑思维能力较强',
          hasProjectExperience ? '具备一定的项目实战经验' : '学习能力强，有较好的技术潜力',
        ],
        improvements: [
          `需要加强${type === 'java' ? '并发编程和性能优化' : '前端工程化和性能调优'}方面的知识`,
          '深入理解核心概念的原理和应用场景',
          '提升复杂问题的分析和解决能力',
          '加强团队协作和技术文档编写能力',
        ],
        recommendations: `建议候选人继续深入学习${role}核心技术栈，参与更多实际项目实践，积累解决复杂问题的经验。同时加强系统设计和架构思维的培养，提升技术视野和创新能力。`,
        summary: `候选人在${role}技术方面有较好的基础，具备${hasProjectExperience ? '一定的项目经验' : '较强的学习能力'}。技术理解清晰，沟通表达流畅，问题分析思路明确。总体评价${baseScore >= 8 ? '优秀' : baseScore >= 7 ? '良好' : '合格'}，有潜力成为优秀的${type === 'java' ? '后端' : '前端'}工程师。`,
      },
    }
  }
}