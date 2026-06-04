// API响应类型
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// 用户相关类型
export interface UserProfile {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

// 面试相关类型
export interface InterviewCreate {
  type: string // 'java' | 'web'
  title: string
  description?: string
}

export interface Interview {
  id: string
  userId: string
  type: string
  status: string // preparing, active, completed, cancelled
  title: string
  description: string | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  duration: number | null
  messages?: Message[]
  evaluations?: EvaluationReport[]
}

export interface Message {
  id: string
  interviewId: string
  role: string // 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl: string | null
}

export interface EvaluationReport {
  id: string
  interviewId: string
  scores: {
    technical: number
    communication: number
    problemSolving: number
    knowledgeDepth: number
    overall: number
  }
  feedback: string | null
  strengths: string | null
  improvements: string | null
  createdAt: Date
}

export interface Resume {
  id: string
  userId: string
  content: string | null
  fileUrl: string | null
  parsedData: any | null
  createdAt: Date
}

// 分页类型
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 表单验证类型
export interface ValidationError {
  field: string
  message: string
}