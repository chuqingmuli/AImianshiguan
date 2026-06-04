'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface SpeechToTextProps {
  onTextChange: (text: string) => void
  onSpeechSpeed: (speed: number) => void
  onStartListening?: () => void
}

interface SpeechToTextHandle {
  toggleListening: () => void
}

const SpeechToText = forwardRef<SpeechToTextHandle, SpeechToTextProps>(({ onTextChange, onSpeechSpeed, onStartListening }, ref) => {
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [transcript, setTranscript] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [charCount, setCharCount] = useState(0)
  
  const Recognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

  useEffect(() => {
    if (Recognition) {
      const recognitionInstance = new Recognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'zh-CN'
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        const combinedTranscript = finalTranscript + interimTranscript
        setTranscript(combinedTranscript)
        onTextChange(combinedTranscript)
        
        // 更新字符计数
        if (finalTranscript) {
          setCharCount(prev => prev + finalTranscript.length)
        }
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('语音识别错误:', event.error)
        setIsListening(false)
      }
      
      recognitionInstance.onend = () => {
        setIsListening(false)
        // 计算语速（字符数/分钟）
        if (startTime && charCount > 0) {
          const durationMinutes = (Date.now() - startTime) / 60000
          const speechSpeed = Math.round(charCount / durationMinutes)
          onSpeechSpeed(speechSpeed)
        }
      }
      
      setRecognition(recognitionInstance)
    }
    
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [Recognition, startTime, charCount, onSpeechSpeed])

  const toggleListening = () => {
    if (!recognition) return
    
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      // 开始新的语音识别前，清空之前的转录文本
      setTranscript('')
      onTextChange('')
      
      recognition.start()
      setIsListening(true)
      setStartTime(Date.now())
      setCharCount(0)
      // 开始录音时通知父组件
      if (onStartListening) {
        onStartListening()
      }
    }
  }

  // 暴露toggleListening方法给父组件
  useImperativeHandle(ref, () => ({
    toggleListening
  }))

  if (!Recognition) {
    return (
      <button
        className="shrink-0 rounded-full w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed"
        disabled
      >
        <Mic className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleListening}
      className={`shrink-0 rounded-full w-10 h-10 flex items-center justify-center ${
        isListening
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      } relative`}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          {/* 波动动画 */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 border-red-400 opacity-50 animate-ping"
                style={{
                  width: `${20 + i * 5}px`,
                  height: `${20 + i * 5}px`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  )
})

export default SpeechToText
