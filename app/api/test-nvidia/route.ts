export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          { role: 'system', content: 'You ONLY respond with valid JSON. Reply with JSON matching: {"message": "your response here"}' },
          ...messages,
        ],
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    })
    
    const data = await response.text()
    return new Response(data, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, name: error.name, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
