import {
  CopilotRuntime,
  createCopilotEndpoint,
  InMemoryAgentRunner,
} from '@copilotkit/runtime/v2'
import { handle } from 'hono/vercel'

import { createProjectAgent } from '@/lib/project-agent'

const runtime = new CopilotRuntime({
  agents: { 'project-focus': createProjectAgent() },
  runner: new InMemoryAgentRunner(),
})

const app = createCopilotEndpoint({
  runtime,
  basePath: '/api/copilotkit-project',
  mode: 'single-route',
  cors: { origin: '*' },
})

const copilotHandler = handle(app)

const wrappedHandler = async (req: Request, ...args: unknown[]) => {
  if (req.method === 'GET' && new URL(req.url).pathname.includes('/threads')) {
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
