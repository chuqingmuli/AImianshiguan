'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { WsChatClient, WebsocketsEventType, RoleType } from '@coze/api/ws-tools'

interface PhoneCallProps {
  botId: string
  pat: string
  className?: string
}

export default function PhoneCall({ botId, pat, className = '' }: PhoneCallProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const clientRef = useRef<WsChatClient | null>(null)
  // 存储音频元素引用
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // 清理音频元素
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.src = ''
      }
      
      // 清理媒体流
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // 清理音频上下文
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      
      // 清理 WebSocket 连接
      if (clientRef.current) {
        try {
          clientRef.current.close()
        } catch (e) {}
      }
    }
  }, [])

  const startCall = async () => {
    if (!botId || !pat) {
      setError('缺少Bot ID或PAT配置')
      return
    }

    setError(null)
    setIsConnecting(true)

    try {
      if (clientRef.current) {
        try {
          clientRef.current.close()
        } catch (e) {}
        clientRef.current = null
      }

      const client = new WsChatClient({
        botId: botId,
        token: pat,
        allowPersonalAccessTokenInBrowser: true,
        debug: true,
      })

      client.onOpen = () => {
        console.log('WebSocket连接已打开')
      }

      client.onMessage = (data: any) => {
        console.log('收到消息:', data)
      }

      client.onError = (error: any) => {
        console.error('WebSocket错误:', error)
        setError(`通话错误: ${error.message || '未知错误'}`)
        setIsConnecting(false)
      }

      client.onClose = () => {
        console.log('WebSocket连接已关闭')
        setIsConnected(false)
      }

      clientRef.current = client
      await client.connect()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      setIsConnected(true)
      setIsConnecting(false)
    } catch (err: any) {
      console.error('连接失败:', err)
      setError(`连接失败: ${err.message || '请检查网络和配置'}`)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    // 立即中断对话（停止所有音频播放）
    if (clientRef.current) {
      try {
        clientRef.current.interrupt()
      } catch (err) {
        console.error('中断对话时出错:', err)
      }
    }

    // 立即停止所有音频播放
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.src = ''
    }

    // 立即停止音频上下文
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
        audioContextRef.current = null
      } catch (err) {
        console.error('关闭音频上下文时出错:', err)
      }
    }

    // 停止所有媒体流轨道
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // 关闭 WebSocket 连接
    if (clientRef.current) {
      try {
        await clientRef.current.disconnect()
      } catch (err) {
        console.error('断开连接时出错:', err)
      }
      clientRef.current = null
    }

    // 重置状态
    setIsConnected(false)
    setIsConnecting(false)
    setIsMuted(false)
    setIsSpeakerOn(true)
  }

  const toggleMute = async () => {
    if (clientRef.current) {
      try {
        // 使用 Coze SDK 的 setAudioEnable 方法
        await clientRef.current.setAudioEnable(isMuted)
        setIsMuted(!isMuted)
      } catch (err) {
        console.error('设置静音时出错:', err)
      }
    }
  }

  const toggleSpeaker = async () => {
    if (clientRef.current) {
      try {
        // 使用 Coze SDK 的 setPlaybackVolume 方法
        const newVolume = isSpeakerOn ? 0 : 1
        await clientRef.current.setPlaybackVolume(newVolume)
        setIsSpeakerOn(!isSpeakerOn)
      } catch (err) {
        console.error('设置扬声器时出错:', err)
      }
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleSpeaker}
              className={`p-3 rounded-full transition-all ${
                isSpeakerOn
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isSpeakerOn ? '关闭扬声器' : '打开扬声器'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={handleDisconnect}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
              title="结束通话"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            disabled={isConnecting}
            className={`p-4 rounded-full transition-all shadow-lg ${
              isConnecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title="开始通话"
          >
            {isConnecting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 max-w-xs text-center">{error}</div>
      )}

      {isConnected && (
        <div className="text-sm text-green-600 font-medium animate-pulse">
          通话中...
        </div>
      )}

      {!isConnected && !isConnecting && (
        <div className="text-xs text-gray-500">点击开始与AI通话</div>
      )}
    </div>
  )
}