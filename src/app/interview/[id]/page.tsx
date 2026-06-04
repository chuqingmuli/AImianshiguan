'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Play, Pause, CircleStop, Clock, User, Bot, Volume2, VolumeX, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SpeechToText from '@/components/SpeechToText'

// 类型定义
interface Message {
  id: string
  interviewId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  messageType: string
  audioUrl?: string
}

interface Interview {
  id: string
  userId: string
  type: 'java' | 'web'
  status: 'preparing' | 'active' | 'completed' | 'cancelled'
  title: string
  description?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  duration?: number
  sessionId?: string
  messages?: Message[]
}

export default function InterviewPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  
  // 状态管理
  const [interview, setInterview] = useState<Interview | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [speechSpeed, setSpeechSpeed] = useState<number | null>(null)
  const [autoReadAloud, setAutoReadAloud] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoContinueConversation, setAutoContinueConversation] = useState(false)
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechToTextRef = useRef<any>(null)
  
  // 面试计时器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])
  
  // 清理录音资源
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // 音频播放控制
  const audioRef = useRef<HTMLAudioElement>(null)
  // 消息列表ref，用于自动滚动
  const messagesRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到消息底部
  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }

  // 当消息变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 播放消息音频
  const speakMessage = async (text: string, audioUrl?: string) => {
    if (!autoReadAloud) return
    
    try {
      // 停止当前正在播放的音频
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsSpeaking(false)
      }
      
      let finalAudioUrl = audioUrl
      
      // 如果有Coze返回的音频URL，直接使用
      if (audioUrl) {
        console.log('Using Coze audio URL:', audioUrl)
      } else {
        // 使用SiliconFlow TTS API
        console.log('Calling SiliconFlow TTS API with:', text)
        
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        })
        
        if (!response.ok) {
          throw new Error(`SiliconFlow TTS API error: ${response.status}`)
        }
        
        const blob = await response.blob()
        console.log('Received audio blob:', blob.size, 'bytes')
        finalAudioUrl = URL.createObjectURL(blob)
      }
      
      if (audioRef.current && finalAudioUrl) {
        // 再次检查autoReadAloud，确保用户没有在音频生成过程中关闭朗读
        if (!autoReadAloud) {
          console.log('Auto read aloud is disabled, skipping audio playback')
          if (!audioUrl && finalAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(finalAudioUrl)
          }
          return
        }
        
        console.log('Setting audio source:', finalAudioUrl)
        console.log('Audio element exists:', !!audioRef.current)
        
        audioRef.current.src = finalAudioUrl
        
        audioRef.current.onplay = () => {
          console.log('Audio started playing')
          setIsSpeaking(true)
        }
        
        audioRef.current.onended = () => {
          console.log('Audio finished playing')
          setIsSpeaking(false)
          // 音频播放结束后自动开启监听
          if (autoContinueConversation) {
            startListening()
          }
          // 延迟释放URL，确保音频完全播放完成
          setTimeout(() => {
            if (!audioUrl && finalAudioUrl.startsWith('blob:')) {
              URL.revokeObjectURL(finalAudioUrl)
              console.log('Revoked blob URL after delay')
            }
          }, 1000)
        }
        
        audioRef.current.onerror = (e) => {
          console.error('Audio element error:', e)
          setIsSpeaking(false)
          if (!audioUrl && finalAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(finalAudioUrl)
          }
          // 发生错误时也开启监听
          if (autoContinueConversation) {
            startListening()
          }
        }
        
        console.log('Attempting to play audio...')
        audioRef.current.play().then(() => {
          console.log('Audio play started successfully')
        }).catch(error => {
          console.error('Failed to play audio:', error)
          console.error('Error details:', error.name, error.message)
          setIsSpeaking(false)
          if (!audioUrl && finalAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(finalAudioUrl)
          }
          // 发生错误时也开启监听
          if (autoContinueConversation) {
            startListening()
          }
        })
      } else {
        console.error('No audio element or audio URL:', {
          audioRef: !!audioRef.current,
          finalAudioUrl: !!finalAudioUrl
        })
        setIsSpeaking(false)
        // 没有音频时也开启监听
        if (autoContinueConversation) {
          startListening()
        }
      }
      
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
      // 发生错误时也开启监听
      if (autoContinueConversation) {
        startListening()
      }
    }
  }

  // 监听消息变化，当有新的assistant消息时自动朗读
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.messageType === 'text') {
        speakMessage(lastMessage.content, lastMessage.audioUrl)
      }
    }
  }, [messages])

  // 当用户开始输入时停止朗读
  useEffect(() => {
    if (inputValue.length > 0) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsSpeaking(false)
    }
  }, [inputValue])
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 加载面试详情
  useEffect(() => {
    const loadInterview = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 获取URL参数中的userId（支持临时用户）
        const urlParams = new URLSearchParams(window.location.search)
        const tempUserId = urlParams.get('userId')
        
        // 调用API获取面试详情
        const response = await fetch(`/api/interviews/${id}?userId=${tempUserId || ''}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '获取面试详情失败')
        }
        
        const data = await response.json()
        setInterview(data.data)
        setMessages(data.data.messages || [])
        setUserId(tempUserId || data.data.userId)
        
        // 如果面试状态为active，启动计时器
        if (data.data.status === 'active') {
          setIsTimerRunning(true)
          if (data.data.startedAt) {
            const startedTime = new Date(data.data.startedAt).getTime()
            const elapsed = Math.floor((Date.now() - startedTime) / 1000)
            setTimer(elapsed)
          }
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载面试失败')
        console.error('Error loading interview:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadInterview()
  }, [id])
  
  // 发送消息（支持文本和音频）
  const handleSendMessage = async (isAudio = false, audioContent?: Blob, fileExtension = 'webm') => {
    if (sending || !interview || interview.status !== 'active') return
    
    try {
      // 停止当前正在播放的音频
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsSpeaking(false)
      }
      
      setSending(true)
      setError(null)
      
      // 确保userId不为空
      let currentUserId = userId
      if (!currentUserId) {
        // 从URL参数中获取
        const urlParams = new URLSearchParams(window.location.search)
        currentUserId = urlParams.get('userId') || interview.userId
      }
      
      if (!currentUserId) {
        throw new Error('用户ID不能为空')
      }
      
      if (isAudio && audioContent) {
        // 发送音频消息
        const formData = new FormData()
        formData.append('audio_file', audioContent, `voice-${Date.now()}.${fileExtension}`)
        formData.append('userId', currentUserId)
        
        // 创建临时音频消息显示
        const tempAudioMessage: Message = {
          id: `temp-${Date.now()}`,
          interviewId: id,
          role: 'user',
          content: '[语音消息]',
          timestamp: new Date().toISOString(),
          messageType: 'audio',
          audioUrl: ''
        }
        
        setMessages(prev => [...prev, tempAudioMessage])
        setAudioBlob(null)
        
        // 调用语音消息处理API
        const response = await fetch(`/api/interviews/${id}/voice-message`, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '发送语音消息失败')
        }
        
        const result = await response.json()
        
        // 更新消息列表，替换临时消息
        setMessages(prev => {
          const updated = prev.filter(msg => msg.id !== tempAudioMessage.id)
          return [...updated, result.data.userMessage, result.data.assistantMessage]
        })
        
      } else {
        // 发送文本消息
        const content = inputValue.trim()
        if (!content) return
        
        // 创建临时用户消息显示
        const tempUserMessage: Message = {
          id: `temp-${Date.now()}`,
          interviewId: id,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          messageType: 'text'
        }
        
        setMessages(prev => [...prev, tempUserMessage])
        setInputValue('')
        
        // 调用API发送文本消息
        const response = await fetch(`/api/interviews/${id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            userId: currentUserId,
            isAudio: false,
            metadata: {
              speech_speed: speechSpeed || null,
              is_audio_input: false
            }
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '发送消息失败')
        }
        
        const result = await response.json()
        
        // 更新消息列表，替换临时消息
        setMessages(prev => {
          const updated = prev.filter(msg => msg.id !== tempUserMessage.id)
          return [...updated, result.data.userMessage, result.data.assistantMessage]
        })
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送消息失败')
      // 移除临时消息
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }
  
  // 开始面试
  const handleStartInterview = async () => {
    if (!interview || interview.status !== 'preparing') return
    
    try {
      setLoading(true)
      setError(null)
      
      // 确保userId不为空
      let currentUserId = userId
      if (!currentUserId) {
        // 从URL参数中获取
        const urlParams = new URLSearchParams(window.location.search)
        currentUserId = urlParams.get('userId') || interview.userId
      }
      
      if (!currentUserId) {
        throw new Error('用户ID不能为空')
      }
      
      // 更新面试状态为active
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
          startedAt: new Date().toISOString(),
          userId: currentUserId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '开始面试失败')
      }
      
      const updatedInterview = await response.json()
      setInterview(updatedInterview.data)
      setIsTimerRunning(true)
      setUserId(currentUserId)
      
      // 重新获取消息列表，确保开场白显示
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/interviews/${id}/messages?userId=${currentUserId}`, {
            method: 'GET',
          })
          if (response.ok) {
            const data = await response.json()
            setMessages(data.data)
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err)
        }
      }
      fetchMessages()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '开始面试失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 暂停面试
  const handlePauseInterview = async () => {
    if (!interview || interview.status !== 'active') return
    
    try {
      setLoading(true)
      setError(null)
      
      // 确保userId不为空
      let currentUserId = userId
      if (!currentUserId) {
        // 从URL参数中获取
        const urlParams = new URLSearchParams(window.location.search)
        currentUserId = urlParams.get('userId') || interview.userId
      }
      
      if (!currentUserId) {
        throw new Error('用户ID不能为空')
      }
      
      // 更新面试状态为preparing
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'preparing',
          userId: currentUserId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '暂停面试失败')
      }
      
      const updatedInterview = await response.json()
      setInterview(updatedInterview.data)
      setIsTimerRunning(false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '暂停面试失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 结束面试
  const handleEndInterview = async () => {
    if (!interview || interview.status === 'completed') return
    
    if (confirm('确定要结束面试吗？')) {
      try {
        setLoading(true)
        setError(null)
        
        // 确保userId不为空
        let currentUserId = userId
        if (!currentUserId) {
          // 从URL参数中获取
          const urlParams = new URLSearchParams(window.location.search)
          currentUserId = urlParams.get('userId') || interview.userId
        }
        
        if (!currentUserId) {
          throw new Error('用户ID不能为空')
        }
        
        // 调用结束面试API
        const response = await fetch(`/api/interviews/${id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || '结束面试失败')
        }
        
        const result = await response.json()
        setIsTimerRunning(false)
        setUserId(currentUserId)
        
        // 存储userId到localStorage，确保返回首页后仍能访问历史记录
        localStorage.setItem('userId', currentUserId)
        
        // 显示评估报告（可以跳转到评估页面）
        alert('面试已结束！评估报告已生成。')
        router.push(`/history?userId=${encodeURIComponent(currentUserId)}`)
        
        // 最后更新面试状态（避免干扰导航）
        setInterview(result.interview)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '结束面试失败')
      } finally {
        setLoading(false)
      }
    }
  }
  
  // 键盘事件处理
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // 处理语音录制 - 直接录音并发送
  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        // 停止录音
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      } else {
        // 开始录音，尝试使用WAV格式（Coze API支持的格式）
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // 尝试使用WAV格式，如果不支持则使用WebM
        const supportedMimeTypes = ['audio/wav', 'audio/webm']
        const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm'
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        
        // 重置录音数据
        audioChunksRef.current = []
        
        // 监听录音数据
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        
        // 录音结束时处理
        mediaRecorder.onstop = async () => {
          try {
            // 创建音频Blob，使用浏览器实际录制的格式
            const mimeType = mediaRecorder.mimeType || 'audio/webm'
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
            setAudioBlob(audioBlob)
            
            // 根据实际录制的格式设置文件扩展名
            const fileExtension = mimeType.includes('wav') ? 'wav' : 
                                mimeType.includes('mp3') ? 'mp3' : 
                                mimeType.includes('ogg') ? 'ogg' : 'webm'
            
            // 自动发送音频消息
            await handleSendMessage(true, audioBlob, fileExtension)
            
            // 停止所有音轨
            stream.getTracks().forEach(track => track.stop())
            
          } catch (error) {
            console.error('处理录音数据失败:', error)
            alert('处理录音数据失败')
          } finally {
            setIsRecording(false)
          }
        }
        
        // 开始录音
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
        
        // 录音时间限制（最多60秒）
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
          }
        }, 60000)
        
      }
    } catch (error) {
      console.error('录音操作失败:', error)
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('请允许浏览器访问麦克风权限')
      } else {
        alert('录音失败，请检查麦克风是否可用')
      }
      setIsRecording(false)
    }
  }
  
  // 获取AI面试官信息
  const getInterviewerInfo = () => {
    if (!interview) return null
    
    const isJava = interview.type === 'java'
    return {
      name: isJava ? 'Java技术面试官' : 'Web前端面试官',
      role: isJava ? '资深Java架构师' : '资深前端工程师',
      avatar: '🌐',
      description: isJava 
        ? '专注于Java核心技术、Spring框架、微服务架构等领域的技术专家'
        : '专注于前端框架、JavaScript、性能优化等领域的技术专家'
    }
  }
  
  const interviewerInfo = getInterviewerInfo()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">加载面试中...</p>
        </div>
      </div>
    )
  }
  
  if (error || !interview || !interviewerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="text-red-600 mb-4">{error || '面试不存在'}</p>
          <Button onClick={() => router.push('/')} className="bg-gray-800 hover:bg-gray-700 text-white">
            返回首页
          </Button>
        </div>
      </div>
    )
  }
  
  const isJava = interview.type === 'java'
  const isPreparing = interview.status === 'preparing'
  const isActive = interview.status === 'active'
  const hasMessages = messages.length > 0
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              返回
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">{interview.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                router.push(`/phone?type=${interview.type}`)
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>电话面试</span>
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-800' :
              interview.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {isActive ? '进行中' :
               interview.status === 'completed' ? '已结束' :
               interview.status === 'cancelled' ? '已取消' : '准备中'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* 主内容区：居中卡板布局 */}
        <div className="max-w-3xl mx-auto">
          {/* 对话主卡板 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* 初始状态：欢迎界面 */}
            {isPreparing && !hasMessages ? (
              <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl mb-6">
                  {interviewerInfo.avatar}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  准备好开始{isJava ? 'Java' : 'Web前端'}技术面试了吗？
                </h2>
                <p className="text-blue-600 mb-8 max-w-md font-medium">
                  {interviewerInfo.name}将引导你完成整个面试过程。点击下方按钮开始你的技术面试之旅。<br /><br />
                  如果你想体验实时交流且拥有表达分析的话，可以在本页面右上角点击"电话面试"按钮与面试官进行电话面试。
                </p>
                <Button 
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-medium rounded-xl shadow-md transition-all duration-200"
                >
                  <Play className="mr-2 h-5 w-5" />
                  开始面试
                </Button>
              </div>
            ) : (
              <>
                {/* 对话区域 */}
                <div className="p-6 h-[calc(100vh-320px)] md:h-[calc(100vh-300px)] flex flex-col">
                  {/* 消息列表 */}
                  <div className="flex-1 overflow-y-auto space-y-4" style={{ maxHeight: '600px' }} ref={messagesRef}>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Bot className="h-12 w-12 mb-2" />
                        <p className="text-sm">面试已开始，开始你的对话</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start gap-3 max-w-[85%] ${
                            message.role === 'user' ? 'flex-row-reverse' : ''
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className={`rounded-xl p-4 ${
                                message.role === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                {message.messageType === 'audio' ? (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm">语音消息</span>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                  </div>
                  
                  {/* 底部控制区 */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {/* 输入框区域 */}
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入你的回答..."
                      disabled={sending}
                      className="flex-1 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !inputValue.trim() || !isActive}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <SpeechToText
                      ref={speechToTextRef}
                      onTextChange={setInputValue}
                      onSpeechSpeed={setSpeechSpeed}
                      onStartListening={() => {
                        // 开始录音时停止朗读
                        if (audioRef.current) {
                          audioRef.current.pause()
                          audioRef.current.currentTime = 0
                        }
                        setIsSpeaking(false)
                      }}
                    />
                  </div>
                  </div>
                </div>
                
                {/* 底部浮动控制条 */}
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    {/* 计时器 */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900 font-mono">
                        {formatTime(timer)}
                      </span>
                    </div>
                    
                    {/* 控制按钮 */}
                  <div className="flex items-center gap-2">
                    {/* 自动朗读开关 */}
                    <button
                      onClick={() => {
                        const newValue = !autoReadAloud
                        setAutoReadAloud(newValue)
                        // 如果关闭朗读，立即停止当前正在进行的朗读
                        if (!newValue) {
                          if (audioRef.current) {
                            audioRef.current.pause()
                            audioRef.current.currentTime = 0
                          }
                          setIsSpeaking(false)
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        autoReadAloud
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {autoReadAloud ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">
                        {autoReadAloud ? '自动朗读' : '关闭朗读'}
                      </span>
                    </button>

                    {/* 自动衔接对话开关 */}
                    <button
                      onClick={() => {
                        setAutoContinueConversation(!autoContinueConversation)
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        autoContinueConversation
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {autoContinueConversation ? '自动衔接' : '手动衔接'}
                      </span>
                    </button>
                    
                    {isActive && (
                      <Button 
                        onClick={handlePauseInterview}
                        disabled={loading}
                        variant="outline"
                        className="bg-white hover:bg-gray-50 text-gray-700"
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        暂停
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleEndInterview}
                      disabled={loading || interview.status === 'completed'}
                      className="bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <CircleStop className="mr-2 h-4 w-4" />
                      结束面试
                    </Button>
                  </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 音频播放元素 */}
        <audio ref={audioRef} style={{ display: 'none' }} />
        
        {/* 错误提示 */}
        {error && (
          <div className="max-w-3xl mx-auto mt-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
      </main>
    </div>
  )
}