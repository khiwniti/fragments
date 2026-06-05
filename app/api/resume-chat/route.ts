import { handleAPIError } from '@/lib/api-errors'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { toResumePrompt } from '@/lib/resume-prompt'
import { resumeContentSchema } from '@/lib/schema'
import { streamObject, LanguageModel } from 'ai'

export const maxDuration = 300

export async function POST(req: Request) {
  const {
    messages,
    model,
    config,
  }: {
    messages: { role: string; content: string }[]
    model?: LLMModel
    config?: LLMModelConfig
  } = await req.json()

  // Default to Llama 3.1 70B via NVIDIA NIM if no model specified
  const activeModel: LLMModel = model || {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'NVIDIA',
    providerId: 'nvidia',
  }

  const activeConfig: LLMModelConfig = config || {}

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = activeConfig
  const modelClient = getModelClient(activeModel, activeConfig)

  // Extract the latest user question from messages
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const question = lastUserMsg?.content || ''

  try {
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema: resumeContentSchema,
      system: toResumePrompt(question),
      messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      maxRetries: 0,
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    return handleAPIError(error, { hasOwnApiKey: !!activeConfig.apiKey })
  }
}
