import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import interviewService, { 
  CreateInterviewRequest,
  CreateMessageRequest,
  CreateInterviewResponse,
  CreateMessageResponse,
  EvaluationResponse
} from '@/services/interview-service'
import { Interview, Message } from '@prisma/client'

// 创建新面试
export function useCreateInterview() {
  return useMutation({
    mutationFn: (data: CreateInterviewRequest) => 
      interviewService.createInterview(data),
    onSuccess: (data) => {
      console.log('Interview created successfully:', data)
    },
    onError: (error) => {
      console.error('Failed to create interview:', error)
    },
  })
}

// 获取面试列表
export function useInterviews(
  params?: { page?: number; limit?: number; userId?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['interviews', params],
    queryFn: () => interviewService.getInterviews(params),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
    enabled: options?.enabled,
  })
}

// 获取面试详情
export function useInterview(id: string) {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewService.getInterview(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30秒
  })
}

// 发送消息
export function useSendMessage(interviewId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateMessageRequest) => 
      interviewService.sendMessage(interviewId, data),
    onSuccess: (data) => {
      // 更新消息列表缓存
      queryClient.invalidateQueries({ queryKey: ['messages', interviewId] })
      
      // 更新面试状态缓存
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
    },
    // 乐观更新
    onMutate: async (newMessage) => {
      // 取消正在进行的消息列表获取
      await queryClient.cancelQueries({ queryKey: ['messages', interviewId] })
      
      // 获取当前消息列表
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', interviewId])
      
      // 创建临时用户消息
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        interviewId,
        role: 'user',
        content: newMessage.content,
        audioUrl: newMessage.audioUrl || null,
        timestamp: new Date(),
        messageType: 'text',
      }
      
      // 更新缓存
      if (previousMessages) {
        queryClient.setQueryData(['messages', interviewId], [
          ...previousMessages,
          optimisticUserMessage,
        ])
      }
      
      return { previousMessages }
    },
    onError: (error, newMessage, context) => {
      console.error('Failed to send message:', error)
      // 回滚乐观更新
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', interviewId], context.previousMessages)
      }
    },
    onSettled: () => {
      // 重新获取消息列表
      queryClient.invalidateQueries({ queryKey: ['messages', interviewId] })
    },
  })
}

// 获取消息历史
export function useInterviewMessages(interviewId: string) {
  return useQuery({
    queryKey: ['messages', interviewId],
    queryFn: () => interviewService.getMessages(interviewId),
    enabled: !!interviewId,
    staleTime: 0, // 立即失效，确保最新消息
    refetchInterval: false,
  })
}

// 结束面试
export function useCompleteInterview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (interviewId: string) => 
      interviewService.completeInterview(interviewId),
    onSuccess: (data, interviewId) => {
      // 更新面试状态缓存
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
    onError: (error) => {
      console.error('Failed to complete interview:', error)
    },
  })
}

// 生成评估报告
export function useGenerateEvaluation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (interviewId: string) => 
      interviewService.generateEvaluation(interviewId),
    onSuccess: (data, interviewId) => {
      // 更新面试状态缓存
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['evaluation', interviewId] })
    },
    onError: (error) => {
      console.error('Failed to generate evaluation:', error)
    },
  })
}

// 获取评估报告
export function useEvaluation(interviewId: string) {
  return useQuery({
    queryKey: ['evaluation', interviewId],
    queryFn: () => interviewService.getEvaluation(interviewId),
    enabled: !!interviewId,
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}