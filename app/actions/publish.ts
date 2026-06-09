'use server'

import { Duration } from '@/lib/duration'

export async function publish(
  _url: string,
  _sbxId: string,
  _duration: Duration,
  _teamID: string | undefined,
  _accessToken: string | undefined
): Promise<{ url: string }> {
  // Stub: publish is handled by the sandbox service
  return { url: _url }
}
