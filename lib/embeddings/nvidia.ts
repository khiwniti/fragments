import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
})

export const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5'
export const EMBEDDING_DIM = 1024

export async function embedText(input: string | string[]): Promise<number[][]> {
  const texts = Array.isArray(input) ? input : [input]
  if (texts.length === 0) return []

  const resp = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    encoding_format: 'float',
  })

  return resp.data.map((d) => d.embedding)
}

export async function embedQuery(query: string): Promise<number[]> {
  const vectors = await embedText(query)
  return vectors[0]
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return embedText(texts)
}
