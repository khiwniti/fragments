export async function GET() {
  return Response.json({
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
    nvidiaKeyPrefix: process.env.NVIDIA_API_KEY ? process.env.NVIDIA_API_KEY.substring(0, 10) + '...' : null,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  })
}
