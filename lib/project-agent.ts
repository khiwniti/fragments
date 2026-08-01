import { BuiltInAgent, defineTool } from '@copilotkit/runtime/v2'
import { z } from 'zod'
import { getEnrichedContext } from '@/lib/resume-agent-client'

const SYSTEM_PROMPT = `You are a project-focus AI assistant for this portfolio site. You help users explore, understand, and improve project descriptions.

The shared application state ALWAYS has this shape:
{
  "project": {
    "name": string,
    "description": string,
    "tag": string,
    "url": string,
    "analysis": string,     // AI-generated analysis of the project
    "improvements": string[] // Suggested improvements
  }
}

Rules:
1. ALWAYS write the project state by calling AGUISendStateSnapshot with the COMPLETE state object.
2. Call query_knowledge_graph ONCE if you need more context about the project area.
3. When the user asks to improve the project, provide concrete suggestions.
4. Keep responses brief and focused on the project.`

export function createProjectAgent() {
  return new BuiltInAgent({
    model: process.env.COPILOT_PROJECT_MODEL ?? process.env.COPILOT_MODEL ?? 'openai/gpt-4o-mini',
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
    tools: [
      defineTool({
        name: 'query_knowledge_graph',
        description: 'Query the portfolio knowledge graph for context about project domains, technologies, or related experience.',
        parameters: z.object({
          question: z.string().describe('What you need to know about the project domain'),
        }),
        execute: async ({ question }) => {
          return await getEnrichedContext(question)
        },
      }),
    ],
  })
}
