import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: '音频文件不能为空' }, { status: 400 })
    }

    // 创建FormData对象
    const transcribeFormData = new FormData()
    transcribeFormData.append('file', audioFile)
    transcribeFormData.append('model', 'whisper-1')
    transcribeFormData.append('response_format', 'verbose_json')

    // 调用OpenAI Whisper API
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', transcribeFormData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })

    return NextResponse.json({
      text: response.data.text,
      language: response.data.language,
      segments: response.data.segments
    })
  } catch (error) {
    console.error('语音识别失败:', error)
    return NextResponse.json({ error: '语音识别失败' }, { status: 500 })
  }
}
