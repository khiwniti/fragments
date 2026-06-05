'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

interface BlogMarkdownProps {
  content: string
}

export function BlogMarkdown({ content }: BlogMarkdownProps) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'sup', 'sub',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    })
  }, [content])

  return (
    <div
      className="blog-markdown prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
