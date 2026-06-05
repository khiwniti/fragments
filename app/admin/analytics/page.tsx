export const dynamic = 'force-dynamic'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Site traffic and performance metrics.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p>Analytics integration coming soon.</p>
        <p className="text-sm mt-1">Connect PostHog or Google Analytics to see data here.</p>
      </div>
    </div>
  )
}
