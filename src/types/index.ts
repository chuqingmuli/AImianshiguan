// CodeCanvas 类型定义文件

// 面试类型
export type InterviewType = 'java' | 'web'

// 面试状态
export type InterviewStatus = 'preparing' | 'active' | 'completed' | 'cancelled'

// 消息角色
export type MessageRole = 'user' | 'assistant'

// 用户信息
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
}

// 面试信息
export interface Interview {
  id: string
  userId: string
  type: InterviewType
  status: InterviewStatus
  title: string
  description?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  duration?: number
  user?: User
}

// 消息信息
export interface Message {
  id: string
  interviewId: string
  role: MessageRole
  content: string
  timestamp: Date
  audioUrl?: string
}

// 评估报告
export interface EvaluationReport {
  id: string
  interviewId: string
  scores: Scores
  feedback?: string
  strengths?: string
  improvements?: string
  createdAt: Date
}

// 评分数据
export interface Scores {
  technical: number
  communication: number
  problemSolving: number
  depth: number
  overall: number
}

// 反馈数据
export interface Feedback {
  strengths: string[]
  improvements: string[]
  recommendations: string
  summary: string
}

// 评估数据
export interface EvaluationData {
  scores: Scores
  feedback: Feedback
}

// 创建面试请求
export interface CreateInterviewRequest {
  userId: string
  type: InterviewType
  title?: string
  description?: string
}

// 创建面试响应
export interface CreateInterviewResponse {
  success: boolean
  interview?: Interview
  sessionId?: string
  error?: string
}

// 创建消息请求
export interface CreateMessageRequest {
  content: string
  audioUrl?: string
}

// 创建消息响应
export interface CreateMessageResponse {
  success: boolean
  messages?: Message[]
  error?: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Coze智能体配置
export interface CozeConfig {
  apiKey: string
  botIds: {
    java: string
    web: string
  }
  apiUrl?: string
  timeout?: number
  retryCount?: number
}

// Coze消息格式
export interface CozeMessage {
  role: 'user' | 'assistant'
  content: string
}

// Coze请求体
export interface CozeRequest {
  bot_id: string
  messages: CozeMessage[]
  stream?: boolean
  session_id?: string
}

// Coze响应格式
export interface CozeResponse {
  code: number
  msg: string
  data: {
    id: string
    content: string
    session_id: string
    metadata?: Record<string, any>
  }
}

// 智能体响应
export interface AgentResponse {
  content: string
  messageId: string
  sessionId: string
  timestamp: Date
  metadata?: Record<string, any>
}