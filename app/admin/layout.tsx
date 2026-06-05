import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  LogOut,
  MessageSquare,
  BarChart3,
  Layers,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/series', label: 'Series', icon: Layers },
  { href: '/admin/contact', label: 'Contact', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">
              khiw<span className="text-primary">.dev</span>
            </span>
            <span className="text-xs text-muted-foreground ml-auto">admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <form action="/api/admin/logout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-bold">khiw.dev admin</span>
        <div className="flex gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-2 rounded-lg hover:bg-accent"
            >
              <item.icon className="w-4 h-4" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
