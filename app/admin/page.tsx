import { getAdminPosts } from '@/lib/blog/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Eye, PenLine, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const posts = await getAdminPosts()
  const published = posts.filter((p) => p.status === 'published')
  const drafts = posts.filter((p) => p.status === 'draft')
  const archived = posts.filter((p) => p.status === 'archived')

  const recentPosts = posts.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your blog and site.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-3xl">{published.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">{drafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-3xl">{archived.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Latest blog activity</CardDescription>
          </div>
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        post.status === 'published'
                          ? 'default'
                          : post.status === 'draft'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                  <Link href={`/admin/blog/${post.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <PenLine className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {recentPosts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No posts yet.{' '}
                <Link href="/admin/blog/new" className="text-primary hover:underline">
                  Create your first post
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
