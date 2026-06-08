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

// Use single-route mode to handle both:
// - POST /api/copilotkit with {method: "info"} (SDK fallback)
// - POST /api/copilotkit with {method: "run", ...} (agent execution)
const app = createCopilotEndpoint({
  runtime,
  basePath: '/api/copilotkit',
  mode: 'single-route',
  cors: { origin: '*' },
})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
