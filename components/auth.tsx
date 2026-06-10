import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Provider, SupabaseClient } from '@supabase/supabase-js'
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'


const VIEWS = {
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  FORGOTTEN_PASSWORD: 'forgotten_password',
  MAGIC_LINK: 'magic_link',
  UPDATE_PASSWORD: 'update_password',
} as const

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS]

type RedirectTo = undefined | string

export interface AuthProps {
  supabaseClient: SupabaseClient
  socialLayout?: 'horizontal' | 'vertical'
  providers?: Provider[]
  view?: ViewType
  redirectTo?: RedirectTo
  onlyThirdPartyProviders?: boolean
  magicLink?: boolean
  onSignUpValidate?: (email: string, password: string) => Promise<boolean>
  metadata?: Record<string, any>
}

interface SubComponentProps {
  supabaseClient: SupabaseClient
  setAuthView: (view: ViewType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMessage: (message: string | null) => void
  clearMessages: () => void
  loading: boolean
  redirectTo?: RedirectTo
}

interface SocialAuthProps {
  supabaseClient: SupabaseClient
  providers: Provider[]
  layout?: 'horizontal' | 'vertical'
  redirectTo?: RedirectTo
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  clearMessages: () => void
  loading: boolean
}

interface EmailAuthProps extends SubComponentProps {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP
  magicLink?: boolean
  onSignUpValidate?: (email: string, password: string) => Promise<boolean>
  metadata?: Record<string, any>
}

interface UseAuthFormReturn {
  loading: boolean
  error: string | null
  message: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMessage: (message: string | null) => void
  clearMessages: () => void
}

const ProviderIcons: {
  [key in Provider]?: React.ComponentType<{ className?: string }>
} = {
  github: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  google: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
    </svg>
  ),
}

function useAuthForm(): UseAuthFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setErrorState] = useState<string | null>(null)
  const [message, setMessageState] = useState<string | null>(null)

  const setError = useCallback((errorMsg: string | null) => {
    setErrorState(errorMsg)
    if (errorMsg) setMessageState(null)
  }, [])

  const setMessage = useCallback((msg: string | null) => {
    setMessageState(msg)
    if (msg) setErrorState(null)
  }, [])

  const clearMessages = useCallback(() => {
    setErrorState(null)
    setMessageState(null)
  }, [])

  return {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  }
}

function SocialAuth({
  supabaseClient,
  providers,
  layout = 'vertical',
  redirectTo,
  setLoading,
  setError,
  clearMessages,
  loading,
}: SocialAuthProps) {
  const handleProviderSignIn = async (provider: Provider) => {
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) setError(error.message)
  }

  return (
    <div
      className={cn(
        'space-y-3',
        layout === 'horizontal' && 'flex space-y-0 space-x-3',
      )}
    >
      {providers.map((provider) => {
        const IconComponent = ProviderIcons[provider]
        const providerName =
          provider.charAt(0).toUpperCase() + provider.slice(1)
        return (
          <Button
            key={provider}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleProviderSignIn(provider)}
            disabled={loading}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {layout === 'vertical'
              ? `Continue with ${providerName}`
              : providerName}
          </Button>
        )
      })}
    </div>
  )
}

interface SignInFormProps extends SubComponentProps {
  magicLink?: boolean
}

function SignInForm({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  clearMessages,
  loading,
}: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="auth-sign-in" onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button
            variant="link"
            type="button"
            onClick={() => setAuthView(VIEWS.FORGOTTEN_PASSWORD)}
            className="p-0 h-auto font-normal text-muted-foreground text-sm"
          >
            Forgot your password?
          </Button>
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="current-password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  )
}

interface SignUpFormProps extends SubComponentProps {
  onSignUpValidate?: (email: string, password: string) => Promise<boolean>
  metadata?: Record<string, any>
}

function SignUpForm({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
  onSignUpValidate,
  metadata,
}: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      if (onSignUpValidate) {
        const isValid = await onSignUpValidate(email, password)
        if (!isValid) {
          throw new Error(
            'Invalid email address. Please use a different email.',
          )
        }
      }
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: metadata,
        },
      })
      if (error) throw error
      if (data.user && !data.session) {
        setMessage('Check your email for the confirmation link.')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="auth-sign-up" onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign Up
      </Button>
    </form>
  )
}

function MagicLink({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: SubComponentProps) {
  const [email, setEmail] = useState('')

  const handleMagicLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    if (error) setError(error.message)
    else setMessage('Check your email for the magic link.')
    setLoading(false)
  }

  return (
    <form
      id="auth-magic-link"
      onSubmit={handleMagicLinkSignIn}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Magic Link
      </Button>
    </form>
  )
}

function ForgottenPassword({
  supabaseClient,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: Omit<SubComponentProps, 'email' | 'setEmail'>) {
  const [email, setEmail] = useState('')

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) setError(error.message)
    else setMessage('Check your email for password reset instructions.')
    setLoading(false)
  }

  return (
    <form
      id="auth-forgot-password"
      onSubmit={handlePasswordReset}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Reset Instructions
      </Button>
    </form>
  )
}

function UpdatePassword({
  supabaseClient,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
}: Omit<
  SubComponentProps,
  'setAuthView' | 'redirectTo' | 'email' | 'setEmail'
>) {
  const [password, setPassword] = useState('')

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    const { error } = await supabaseClient.auth.updateUser({ password })
    if (error) setError(error.message)
    else setMessage('Password updated successfully.')
    setLoading(false)
    if (!error) setPassword('')
  }

  return (
    <form
      id="auth-update-password"
      onSubmit={handlePasswordUpdate}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">Update Password</h3>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </form>
  )
}

function Auth({
  supabaseClient,
  socialLayout = 'vertical',
  providers,
  view = VIEWS.SIGN_IN,
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  onSignUpValidate,
  metadata,
}: AuthProps): JSX.Element | null {
  const [authView, setAuthView] = useState<ViewType>(view)
  const {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  } = useAuthForm()

  useEffect(() => {
    setAuthView(view)
    setError(null)
    setMessage(null)
  }, [view, setError, setMessage])

  const setAuthViewAndClearMessages = useCallback(
    (newView: ViewType) => {
      setAuthView(newView)
      setError(null)
      setMessage(null)
    },
    [setError, setMessage],
  )

  const commonProps = {
    supabaseClient,
    setAuthView: setAuthViewAndClearMessages,
    setLoading,
    setError,
    setMessage,
    clearMessages,
    loading,
    redirectTo,
  }

  let viewComponent: React.ReactNode = null

  switch (authView) {
    case VIEWS.SIGN_IN:
      viewComponent = <SignInForm {...commonProps} />
      break
    case VIEWS.SIGN_UP:
      viewComponent = (
        <SignUpForm
          {...commonProps}
          onSignUpValidate={onSignUpValidate}
          metadata={metadata}
        />
      )
      break
    case VIEWS.FORGOTTEN_PASSWORD:
      viewComponent = <ForgottenPassword {...commonProps} />
      break
    case VIEWS.MAGIC_LINK:
      viewComponent = <MagicLink {...commonProps} />
      break
    case VIEWS.UPDATE_PASSWORD:
      viewComponent = <UpdatePassword {...commonProps} />
      break
    default:
      viewComponent = null
  }

  const showSocialAuth = providers && providers.length > 0
  const showSeparator = showSocialAuth && !onlyThirdPartyProviders

  return (
    <div className="w-full space-y-4">
      {authView === VIEWS.UPDATE_PASSWORD ? (
        viewComponent
      ) : (
        <>
          {showSocialAuth && (
            <SocialAuth
              supabaseClient={supabaseClient}
              providers={providers || []}
              layout={socialLayout}
              redirectTo={redirectTo}
              setLoading={setLoading}
              setError={setError}
              clearMessages={clearMessages}
              loading={loading}
            />
          )}
          {showSeparator && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          )}
          {!onlyThirdPartyProviders && viewComponent}
        </>
      )}

      {!onlyThirdPartyProviders && authView !== VIEWS.UPDATE_PASSWORD && (
        <div className="text-center text-sm space-y-1 mt-4">
          {authView === VIEWS.SIGN_IN && (
            <>
              {magicLink && (
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setAuthViewAndClearMessages(VIEWS.MAGIC_LINK)}
                  className="p-0 h-auto font-normal"
                >
                  Sign in with magic link
                </Button>
              )}
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_UP)}
                  className="p-0 h-auto underline"
                >
                  Sign up
                </Button>
              </p>
            </>
          )}
          {authView === VIEWS.SIGN_UP && (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="link"
                type="button"
                onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
                className="p-0 h-auto underline"
              >
                Sign in
              </Button>
            </p>
          )}
          {authView === VIEWS.MAGIC_LINK && (
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
              className="p-0 h-auto font-normal"
            >
              Sign in with password instead
            </Button>
          )}
          {authView === VIEWS.FORGOTTEN_PASSWORD && (
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
              className="p-0 h-auto underline"
            >
              Back to Sign In
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default Auth
