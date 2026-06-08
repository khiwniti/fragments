import { createOpenAI } from '@ai-sdk/openai'
import { BuiltInAgent, defineTool } from '@copilotkit/runtime/v2'
import { z } from 'zod'

import { getEnrichedContext } from '@/lib/resume-agent-client'

// NOTE on shared state: @copilotkit/runtime 1.59.x BuiltInAgent server tools
// have signature `execute(args) => Promise<unknown>` — there is NO setState in
// the handler context. The agent writes shared state exclusively through the
// built-in AGUISendStateSnapshot / AGUISendStateDelta tools (injected by
// BuiltInAgent automatically); only those tool names emit STATE_SNAPSHOT /
// STATE_DELTA events to the frontend. So the system prompt instructs the model
// to write the resume via AGUISendStateSnapshot with the full
// ResumeAgentState shape (see lib/schema.ts: resumeAgentStateSchema).
const SYSTEM_PROMPT = `You are the resume agent for this portfolio site. You build and update a structured resume that the UI renders live from shared agent state.

The shared application state MUST always have this exact shape (ResumeAgentState):
{
  "resume": {
    "commentary": string,            // warm, conversational response to the question
    "focus": string,                 // short phrase: what this resume view is tuned for
    "sections": [
      {
        "id": string,                // stable kebab-case id, e.g. "experience-acme-2023"
        "type": "highlights" | "experience" | "projects" | "skills" | "education" | "certifications" | "summary",
        "title": string,
        "items": [
          {
            "id": string,            // stable kebab-case id
            "label": string,
            "value": string?,        // short value or description
            "detail": string?,       // longer explanation / bullet point
            "tags": string[]?,       // small badges, e.g. tech stack or dates
            "url": string?,
            "children": Item[]?      // hierarchical drill-down details
          }
        ]
      }
    ]
  },
  "highlights": string[]             // ids of sections/items changed or expanded in the LAST turn
}

Rules:
1. ALWAYS write the resume by calling AGUISendStateSnapshot with the COMPLETE state object ({ resume, highlights }). Never describe changes without calling it, and never send a fragment — always the full resume.
2. Call query_knowledge_graph ONCE with a single comprehensive question covering everything you need (experience, projects, skills, education, certifications) — never invent facts about the candidate, and never split it into multiple queries.
3. On first run, generate a complete resume: summary, highlights, experience, projects, skills, education, certifications.
4. When the user asks about a specific item ("Tell me more about X"), answer briefly in chat AND send an updated snapshot adding a children[] hierarchy under that item with concrete sub-details, and set highlights to that item's id.
5. Give every section and item a stable kebab-case id. Preserve existing ids when updating.
6. Keep chat replies brief; the resume is the primary surface.`

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
// NOTE: llama-3.1-70b stringifies nested tool-call args (sends snapshot as a
// Python-repr string instead of a JSON object), which breaks the shared-state
// snapshot. qwen3-next emits proper structured objects but generates tool calls
// in a format AI SDK v6 rejects ("Expected 'function.name' to be a string").
// llama-4-maverick has the best tool-calling compatibility with AI SDK v6.
const DEFAULT_NVIDIA_MODEL = 'meta/llama-4-maverick-17b-128e-instruct'

/**
 * Resolve the model for the resume agent.
 *
 * BuiltInAgent's string form only supports openai/anthropic/google/vertex
 * providers (resolveModel). This repo's configured provider is NVIDIA
 * (NVIDIA_API_KEY in .env.local, same pattern as lib/models.ts), which is
 * OpenAI-compatible, so by default we pass an AI SDK model instance.
 * COPILOT_MODEL can override: "openai/...", "anthropic/...", "google/..."
 * strings are passed through to BuiltInAgent; anything else is treated as an
 * NVIDIA model id.
 */
function resolveResumeModel() {
  const spec = process.env.COPILOT_MODEL
  if (spec && /^(openai|anthropic|google|gemini|google-gemini|vertex)[/:]/i.test(spec)) {
    return spec
  }
  const nvidia = createOpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: NVIDIA_BASE_URL,
  })
  return nvidia.chat(spec ?? DEFAULT_NVIDIA_MODEL)
}

export function createResumeAgent() {
  return new BuiltInAgent({
    model: resolveResumeModel(),
    prompt: SYSTEM_PROMPT,
    maxSteps: 5,
    tools: [
      defineTool({
        name: 'query_knowledge_graph',
        description:
          'Query the portfolio knowledge graph for facts about the candidate (career, projects, skills, education). Call before writing resume facts.',
        parameters: z.object({
          question: z.string().describe('What you need to know'),
        }),
        execute: async ({ question }) => {
          return await getEnrichedContext(question)
        },
      }),
    ],
  })
}
