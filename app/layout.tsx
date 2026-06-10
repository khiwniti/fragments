import './globals.css'
import { PostHogProvider, ThemeProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Ikkyu — Forward-Deployed Full Stack Developer',
  description: 'Portfolio of Khiw (Ikkyu) Nitithadachot. Forward-Deployed Full Stack Developer, AI Agent Architect, and Multi-Agent Systems Engineer.',
  keywords: ['AI', 'full-stack', 'developer', 'portfolio', 'khiw.dev', 'Ikkyu', 'TypeScript', 'Next.js', 'LangGraph'],
  authors: [{ name: 'Khiw (Ikkyu) Nitithadachot' }],
  openGraph: {
    title: 'Ikkyu — Forward-Deployed Full Stack Developer',
    description: 'Portfolio of Khiw (Ikkyu) Nitithadachot. Forward-Deployed Full Stack Developer, AI Agent Architect, and Multi-Agent Systems Engineer.',
    url: 'https://khiw.dev',
    siteName: 'khiw.dev',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body className={`${geist.variable} ${geistMono.variable} font-sans`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster />
          <Analytics />
        </body>
      </PostHogProvider>
    </html>
  )
}
