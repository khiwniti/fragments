import { toResumePrompt } from '@/lib/resume-prompt'
import type { ResumeSandbox } from '@/lib/resume-sandbox'

export const maxDuration = 300

export async function POST(req: Request) {
  const { messages, sandbox } = (await req.json()) as {
    messages: Array<{ role: string; content: string }>
    sandbox?: ResumeSandbox | null
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const question = lastUserMsg?.content || ''

  const systemPrompt = toResumePrompt(question, undefined, sandbox ?? null)

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
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 3072,
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

    // AI SDK v6 useObject reads the raw text stream and accumulates it,
    // calling parsePartialJson() on the accumulated text with each chunk.
    // So we stream raw JSON delta content directly from NVIDIA SSE events.
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
                    // Stream raw JSON delta content directly.
                    // useObject will accumulate these chunks and parse partial JSON.
                    controller.enqueue(encoder.encode(deltaContent))
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
  } catch (error) {
    // Log full error server-side; return generic message to client to avoid leaking internals
    console.error('Resume chat error:', error)
    return new Response('An unexpected error occurred. Please try again later.', {
      status: 500,
    })
  }
}
