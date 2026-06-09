import { supabase } from './supabase'
import { ViewType } from '@/components/auth'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect, useRef } from 'react'

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export async function getUserTeam(
  session: Session,
): Promise<UserTeam | undefined> {
  // Anonymous users don't have teams — skip the query to avoid 404
  if ((session.user as any).is_anonymous) return undefined
  try {
    const { data: defaultTeam } = await supabase!
      .from('users_teams')
      .select('teams (id, name, tier, email)')
      .eq('user_id', session?.user.id)
      .eq('is_default', true)
      .maybeSingle()

    return defaultTeam?.teams as unknown as UserTeam
  } catch {
    return undefined
  }
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: ViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)
  const posthog = usePostHog()

  // Store callbacks in refs to avoid useEffect infinite loops
  // when parent passes unstable closures
  const setAuthDialogRef = useRef(setAuthDialog)
  const setAuthViewRef = useRef(setAuthView)
  setAuthDialogRef.current = setAuthDialog
  setAuthViewRef.current = setAuthView

  useEffect(() => {
    if (!supabase) {
      console.warn(
        '[auth] Supabase is not initialized; using a demo session. ' +
          'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable real auth.',
      )
      return setSession({ user: { email: 'demo@khiw.dev' } } as Session)
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session && supabase) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously()
          if (anonData?.session) session = anonData.session
          else console.warn('[auth] Anonymous sign-in failed; falling back to demo session')
        } catch (err) {
          console.warn('[auth] Anonymous sign-in error:', err)
        }
      }
      setSession(session)
      if (session) {
        getUserTeam(session).then(setUserTeam)
        if (!session.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setAuthViewRef.current('update_password')
        setAuthDialogRef.current(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        setRecovery(false)
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        getUserTeam(session as Session).then(setUserTeam)
        setAuthDialogRef.current(false)
        if (!session?.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        setAuthViewRef.current('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [recovery, posthog])

  return {
    session,
    userTeam,
  }
}
