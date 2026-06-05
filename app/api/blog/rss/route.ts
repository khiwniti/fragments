import { getPostsForRSS } from '@/lib/blog/client'

export async function GET() {
  try {
    const posts = await getPostsForRSS(50)
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://khiw.dev'

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>khiw.dev — Blog</title>
    <link>${siteUrl}/blog</link>
    <description>AI, full-stack engineering, and data engineering insights from Ikkyu (Khiw).</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map((post) => {
        const pubDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date(post.created_at).toUTCString()
        const excerpt = post.excerpt || ''
        const tags = post.tags?.map((t) => `<category>${escapeXml(t)}</category>`).join('') || ''
        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <description>${escapeXml(excerpt)}</description>
      ${tags}
    </item>`
      })
      .join('')}
  </channel>
</rss>`

    return new Response(rss.trim(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('RSS API error:', error)
    return new Response('<?xml version="1.0"?><rss></rss>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
