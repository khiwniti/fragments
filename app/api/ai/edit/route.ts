import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      text,
      instruction,
      model: modelId = 'claude-sonnet-4-20250514',
      provider = process.env.NVIDIA_API_KEY ? 'nvidia' : 'anthropic',
    } = await request.json()

    if (!text || !instruction) {
      return Response.json({ error: 'text and instruction required' }, { status: 400 })
    }

    const model: LLMModel = {
      id: modelId,
      name: provider === 'nvidia' ? 'NVIDIA NIM' : 'Claude Sonnet 4',
      provider: provider === 'nvidia' ? 'NVIDIA' : 'Anthropic',
      providerId: provider,
    }

    const config: LLMModelConfig = {
      temperature: 0.3,
      maxTokens: 4096,
    }

    const modelClient = getModelClient(model, config)

    const system = `You are a precise text editor. Follow the user's instruction exactly. Output only the edited text — no explanations, no markdown code fences, no extra commentary. Preserve the original language (Thai or English).`

    const prompt = `Original text:\n---\n${text}\n---\n\nInstruction: ${instruction}\n\nOutput the edited text only:`

    const result = streamText({
      model: modelClient as any,
      system,
      prompt,
    })

    return (result as any).toTextStreamResponse()
  } catch (error) {
    console.error('AI edit API error:', error)
    return Response.json({ error: 'Failed to process edit' }, { status: 500 })
  }
}
