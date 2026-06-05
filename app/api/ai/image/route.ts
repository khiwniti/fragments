import { NextRequest } from 'next/server'
import { generateImage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024', model = 'dall-e-3' } = await request.json()

    if (!prompt) {
      return Response.json({ error: 'prompt required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Image generation not configured' }, { status: 503 })
    }

    const openai = createOpenAI({ apiKey })
    const { image } = await generateImage({
      model: openai.image(model),
      prompt,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
    })

    return Response.json({ image: image.base64, url: image.base64 })
  } catch (error) {
    console.error('AI image API error:', error)
    return Response.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
