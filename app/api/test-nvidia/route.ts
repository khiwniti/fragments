export const maxDuration = 120

export async function POST() {
  const start = Date.now()
  
  try {
    // Quick ping test first
    const pingStart = Date.now()
    const pingRes = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}` },
      signal: AbortSignal.timeout(15000),
    })
    const pingTime = Date.now() - pingStart
    
    if (!pingRes.ok) {
      const pingText = await pingRes.text()
      return Response.json({ 
        error: 'Ping failed',
        status: pingRes.status,
        body: pingText,
        totalTime: Date.now() - start,
        pingTime,
      })
    }
    
    // Now test chat completion with timeout
    const chatStart = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    
    try {
      const chatRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 20,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      
      const chatTime = Date.now() - chatStart
      const data = await chatRes.text()
      
      return Response.json({
        success: true,
        pingTime,
        chatTime,
        totalTime: Date.now() - start,
        status: chatRes.status,
        responsePreview: data.substring(0, 500),
      })
    } catch (chatError: any) {
      clearTimeout(timeout)
      return Response.json({
        error: 'Chat request failed',
        errorName: chatError.name,
        errorMsg: chatError.message,
        pingTime,
        chatTime: Date.now() - chatStart,
        totalTime: Date.now() - start,
      }, { status: 500 })
    }
  } catch (error: any) {
    return Response.json({
      error: 'Overall failure',
      errorName: error.name,
      errorMsg: error.message,
      totalTime: Date.now() - start,
    }, { status: 500 })
  }
}
