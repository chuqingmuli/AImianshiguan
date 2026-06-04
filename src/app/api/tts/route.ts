import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log(`SiliconFlow TTS request received: ${text}`);

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('SiliconFlow API key not configured');
    }

    // 调用SiliconFlow TTS API，使用系统预置音色
    const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'FunAudioLLM/CosyVoice2-0.5B',
        input: text,
        voice: 'FunAudioLLM/CosyVoice2-0.5B:alex', // 沉稳男声，适合面试官形象
        speed: 0.9, // 语速稍慢，更符合面试官形象
        response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    console.log(`SiliconFlow TTS API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`SiliconFlow TTS API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`Received audio data: ${audioBuffer.byteLength} bytes`);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate speech',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
