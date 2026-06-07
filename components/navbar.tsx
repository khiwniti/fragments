import Logo from './logo'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  GitHubLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import { Session } from '@supabase/supabase-js'
import { ArrowRight, LogOut, Trash, Undo, MessageSquare, BookOpen, Shield, Network } from 'lucide-react'
import Link from 'next/link'

export function NavBar({
  session,
  showLogin,
  signOut,
  onClear,
  canClear,
  onSocialClick,
  onUndo,
  canUndo,
  onPrint,
}: {
  session: Session | null
  showLogin: () => void
  signOut: () => void
  onClear?: () => void
  canClear?: boolean
  onSocialClick: (target: 'github' | 'x') => void
  onUndo?: () => void
  canUndo?: boolean
  onPrint?: () => void
}) {
  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo width={24} height={24} />
          <h1 className="whitespace-pre font-bold">
            <span className="text-foreground">khiw</span>
            <span className="text-primary">.dev</span>
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
            <BookOpen className="h-4 w-4" />
            Blog
          </Button>
        </Link>
        <Link href="/chat">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <Shield className="h-4 w-4" />
            Admin
          </Button>
        </Link>
        <Link href="/kg">
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <Network className="h-4 w-4" />
            KG
          </Button>
        </Link>
        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo || !onUndo}
              >
                <Undo className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={!canClear || !onClear}
              >
                <Trash className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {onPrint && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrint}
                >
                  <span className="text-xs font-mono">Print</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print resume</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {session ? (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        session.user.user_metadata?.avatar_url ||
                        'https://avatar.vercel.sh/' + session.user.email
                      }
                      alt={session.user.email}
                    />
                  </Avatar>
                </DropdownMenuTrigger>
              </TooltipTrigger>
                <TooltipContent>My Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm">My Account</span>
                <span className="text-xs text-muted-foreground">
                  {session.user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  window.open('https://khiw.dev', '_blank')
                }}
              >
                <Logo className="mr-2 h-4 w-4 text-muted-foreground" />
                About khiw.dev
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSocialClick('github')}>
                <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Star on GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSocialClick('x')}>
                <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Follow on X
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" onClick={showLogin}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  )
}
