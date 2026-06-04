'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Interview, Message } from '@prisma/client'
import { EvaluationData } from '@/services/interview-service'
import {
  useCreateInterview,
  useSendMessage,
  useCompleteInterview,
  useGenerateEvaluation,
} from '@/hooks/use-interview'

interface InterviewContextType {
  // 状态
  currentInterview: Interview | null
  messages: Message[]
  evaluation: EvaluationData | null
  loading: boolean
  error: string | null

  // 操作函数
  startInterview: (type: 'java' | 'web', title?: string, description?: string) => Promise<void>
  sendMessage: (content: string, audioUrl?: string) => Promise<void>
  completeInterview: () => Promise<void>
  generateEvaluation: () => Promise<void>
  setCurrentInterview: (interview: Interview | null) => void
  clearError: () => void
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined)

export function InterviewProvider({ children }: { children: ReactNode }) {
  // 状态管理
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // React Query hooks
  const createInterviewMutation = useCreateInterview()
  const sendMessageMutation = useSendMessage(currentInterview?.id || '')
  const completeInterviewMutation = useCompleteInterview()
  const generateEvaluationMutation = useGenerateEvaluation()

  // 开始面试
  const startInterview = useCallback(async (type: 'java' | 'web', title?: string, description?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await createInterviewMutation.mutateAsync({ type, title, description })
      setCurrentInterview(result.interview)
      setMessages([])
      setEvaluation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }, [createInterviewMutation])

  // 发送消息
  const sendMessage = useCallback(async (content: string, audioUrl?: string) => {
    if (!currentInterview) {
      setError('No active interview')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await sendMessageMutation.mutateAsync({ content, audioUrl })
      
      // 更新本地消息列表
      setMessages(prev => [
        ...prev,
        result.userMessage,
        result.assistantMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }, [currentInterview, sendMessageMutation])

  // 结束面试
  const completeInterview = useCallback(async () => {
    if (!currentInterview) {
      setError('No active interview')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await completeInterviewMutation.mutateAsync(currentInterview.id)
      setCurrentInterview(null)
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete interview')
    } finally {
      setLoading(false)
    }
  }, [currentInterview, completeInterviewMutation])

  // 生成评估报告
  const generateEvaluation = useCallback(async () => {
    if (!currentInterview) {
      setError('No active interview')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await generateEvaluationMutation.mutateAsync(currentInterview.id)
      setEvaluation(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate evaluation')
    } finally {
      setLoading(false)
    }
  }, [currentInterview, generateEvaluationMutation])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const contextValue: InterviewContextType = {
    currentInterview,
    messages,
    evaluation,
    loading,
    error,
    startInterview,
    sendMessage,
    completeInterview,
    generateEvaluation,
    setCurrentInterview,
    clearError,
  }

  return (
    <InterviewContext.Provider value={contextValue}>
      {children}
    </InterviewContext.Provider>
  )
}

export function useInterviewContext() {
  const context = useContext(InterviewContext)
  if (context === undefined) {
    throw new Error('useInterviewContext must be used within an InterviewProvider')
  }
  return context
}