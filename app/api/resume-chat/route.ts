import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { getEnrichedContext } from '@/lib/resume-agent-client'
import { toResumePrompt } from '@/lib/resume-prompt'
import ratelimit from '@/lib/ratelimit'
import { resumeContentSchema as schema } from '@/lib/schema'
import { streamObject, LanguageModel, ModelMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    model,
    config,
  }: {
    messages: ModelMessage[]
    userID: string | undefined
    teamID: string | undefined
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return createRateLimitResponse(limit)
  }

  console.log('userID', userID)
  console.log('teamID', teamID)
  console.log('model', model)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

    // Extract the last user message for targeted knowledge context
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')
    const question = lastUserMessage
      ? typeof lastUserMessage.content === 'string'
        ? lastUserMessage.content
        : ''
      : ''

  try {
    // Fetch enriched live graph context from multiple backend endpoints.
    // Falls back to static knowledge data if backend is unreachable.
    const knowledgeContext = await getEnrichedContext(question || undefined)

    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      system: toResumePrompt(question || undefined, knowledgeContext),
      messages,
      maxRetries: 0,
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    return handleAPIError(error, { hasOwnApiKey: !!config.apiKey })
  }
}
