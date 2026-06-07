import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from '@copilotkit/runtime/v2'
import { handle } from 'hono/vercel'

import { createResumeAgent } from '@/lib/resume-agent'

const runtime = new CopilotRuntime({
  agents: { resume: createResumeAgent() },
  runner: new InMemoryAgentRunner(),
})

const app = createCopilotEndpoint({
  runtime,
  basePath: '/api/copilotkit',
})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
