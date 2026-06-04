import axios from 'axios'
import { Interview, Message, EvaluationReport } from '@prisma/client'

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | any
  message?: string
}

// 面试创建请求类型
export interface CreateInterviewRequest {
  type: 'java' | 'web'
  title?: string
  description?: string
}

// 面试创建响应类型
export interface CreateInterviewResponse {
  interview: Interview
  sessionId: string
}

// 消息创建请求类型
export interface CreateMessageRequest {
  content: string
  audioUrl?: string
}

// 消息创建响应类型
export interface CreateMessageResponse {
  userMessage: Message
  assistantMessage: Message
}

// 评估数据类型
export interface EvaluationData {
  scores: {
    technical: number
    communication: number
    problemSolving: number
    depth: number
    overall: number
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    recommendations: string
    summary: string
  }
}

// 评估响应类型
export interface EvaluationResponse {
  data: EvaluationData
  evaluationReport: EvaluationReport
}

class InterviewService {
  private apiClient = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 创建新面试
  async createInterview(data: CreateInterviewRequest): Promise<CreateInterviewResponse> {
    try {
      const response = await this.apiClient.post<ApiResponse<CreateInterviewResponse>>(
        '/interviews',
        data
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create interview')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Create interview error:', error)
      throw error
    }
  }

  // 获取面试列表
  async getInterviews(params?: { page?: number; limit?: number; userId?: string }): Promise<Interview[]> {
    try {
      // 将limit参数转换为pageSize，匹配API期望的参数名
      const apiParams = params ? {
        page: params.page,
        pageSize: params.limit,
        userId: params.userId,
      } : undefined
      
      const response = await this.apiClient.get<ApiResponse<Interview[]>>(
        '/interviews',
        { params: apiParams }
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch interviews')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Get interviews error:', error)
      throw error
    }
  }

  // 获取面试详情
  async getInterview(id: string): Promise<Interview> {
    try {
      const response = await this.apiClient.get<ApiResponse<Interview>>(
        `/interviews/${id}`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch interview')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Get interview error:', error)
      throw error
    }
  }

  // 发送消息
  async sendMessage(interviewId: string, data: CreateMessageRequest): Promise<CreateMessageResponse> {
    try {
      const response = await this.apiClient.post<ApiResponse<CreateMessageResponse>>(
        `/interviews/${interviewId}/messages`,
        data
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send message')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Send message error:', error)
      throw error
    }
  }

  // 获取消息历史
  async getMessages(interviewId: string): Promise<Message[]> {
    try {
      const response = await this.apiClient.get<ApiResponse<Message[]>>(
        `/interviews/${interviewId}/messages`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch messages')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Get messages error:', error)
      throw error
    }
  }

  // 结束面试
  async completeInterview(interviewId: string): Promise<Interview> {
    try {
      const response = await this.apiClient.post<ApiResponse<Interview>>(
        `/interviews/${interviewId}/complete`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to complete interview')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Complete interview error:', error)
      throw error
    }
  }

  // 生成评估报告
  async generateEvaluation(interviewId: string): Promise<EvaluationResponse> {
    try {
      const response = await this.apiClient.post<ApiResponse<EvaluationResponse>>(
        `/interviews/${interviewId}/evaluate`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate evaluation')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Generate evaluation error:', error)
      throw error
    }
  }

  // 获取评估报告
  async getEvaluation(interviewId: string): Promise<EvaluationResponse> {
    try {
      const response = await this.apiClient.get<ApiResponse<EvaluationResponse>>(
        `/interviews/${interviewId}/evaluation`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch evaluation')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Get evaluation error:', error)
      throw error
    }
  }
}

export const interviewService = new InterviewService()
export default interviewService