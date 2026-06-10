import { Duration } from './duration'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

export default async function ratelimit(
  key: string | null,
  maxRequests: number,
  window: Duration,
) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn(
      'Rate limiting disabled: KV_REST_API_URL and KV_REST_API_TOKEN must be set. ' +
      'Install Vercel KV or set these env vars to enable rate limiting.'
    )
    return
  }

  const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(maxRequests, window),
  })

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${key}`,
  )

  if (!success) {
    return {
      amount: limit,
      reset,
      remaining,
    }
  }
}
