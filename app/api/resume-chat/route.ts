import { toResumePrompt } from '@/lib/resume-prompt'

export const maxDuration = 300

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
  const question = lastUserMsg?.content || ''

  const systemPrompt = toResumePrompt(question)

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return new Response('NVIDIA_API_KEY not configured', { status: 500 })
  }

  try {
    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 2048,
          temperature: 0.3,
          stream: true,
          response_format: { type: 'json_object' },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NVIDIA API error:', response.status, errorText)
      return new Response(
        `NVIDIA API error: ${response.status} ${errorText}`,
        { status: response.status },
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      return new Response('No response body', { status: 500 })
    }

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    let buffer = ''
    let accumulatedJSON = ''
    let lastEmittedJSON = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const data = line.slice(6)
                try {
                  const parsed = JSON.parse(data)
                  const deltaContent = parsed.choices?.[0]?.delta?.content || ''
                  if (deltaContent) {
                    accumulatedJSON += deltaContent
                    // Try to parse accumulated JSON and emit partial object
                    try {
                      const partialObj = JSON.parse(accumulatedJSON)
                      const partialStr = JSON.stringify(partialObj)
                      // Only emit when the object actually changed
                      if (partialStr !== lastEmittedJSON) {
                        lastEmittedJSON = partialStr
                        // Wrap in ObjectStreamPart format for useObject compatibility
                        const output = JSON.stringify({ type: 'object', object: partialObj }) + '\n'
                        controller.enqueue(encoder.encode(output))
                      }
                    } catch {
                      // JSON not yet complete - continue accumulating
                    }
                  }
                } catch {
                  // Skip malformed SSE JSON
                }
              }
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Resume chat error:', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
