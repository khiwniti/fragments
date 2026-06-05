export const dynamic = 'force-dynamic'

export default function AdminContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Submissions</h1>
        <p className="text-muted-foreground">Manage contact form submissions.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p>No contact submissions yet.</p>
        <p className="text-sm mt-1">Submissions will appear here when visitors use the contact form.</p>
      </div>
    </div>
  )
}
