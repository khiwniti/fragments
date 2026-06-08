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
  mode: 'single-route',
  cors: { origin: '*' },
})

const copilotHandler = handle(app)

// Intercept GET /threads at the top level — the single-route copilot handler rejects non-POST
const wrappedHandler = async (req: Request, ...args: unknown[]) => {
  if (req.method === 'GET' && new URL(req.url).pathname.includes('/threads')) {
    // Return empty thread list — threads aren't persisted in memory mode
    return new Response(JSON.stringify({ threads: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (copilotHandler as any)(req, ...args)
}

export const GET = wrappedHandler
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
