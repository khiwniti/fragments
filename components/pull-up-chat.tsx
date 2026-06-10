'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CopilotChat } from '@copilotkit/react-core/v2'

interface PullUpChatProps {
  agentId: string
  title: string
  description: string
  defaultHeight?: number
}

export function PullUpChat({ agentId, title, description, defaultHeight = 50 }: PullUpChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [height, setHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ y: number; height: number }>({ y: 0, height: defaultHeight })

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = { y: e.clientY, height }
    e.preventDefault()
  }, [height])

  useEffect(() => {
    if (!isDragging) return

    const handleDragMove = (e: MouseEvent) => {
      const deltaY = dragStartRef.current.y - e.clientY
      const newHeight = Math.min(85, Math.max(20, dragStartRef.current.height + (deltaY / window.innerHeight) * 100))
      setHeight(newHeight)
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging])

  return (
    <>
      {/* Toggle button when closed */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        className="md:hidden fixed bottom-4 right-4 z-40 rounded-full bg-primary text-primary-foreground p-3 shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && <div className="chat-drawer-backdrop md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Drawer */}
      <div
        className={`chat-drawer md:hidden ${isOpen ? 'open' : 'closed'} ${isDragging ? 'dragging' : ''}`}
        style={{ height: `${height}vh` }}
      >
        {/* Drag handle */}
        <div
          className="chat-drawer-handle"
          onMouseDown={handleDragStart}
        >
          <div className="chat-drawer-handle-bar" />
        </div>

        {/* Header */}
        <div className="chat-drawer-header">
          <div>
            <div className="chat-drawer-header-title">{title}</div>
            <div className="chat-drawer-header-desc">{description}</div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="chat-drawer-close"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat body */}
        <div className="chat-drawer-body">
          <CopilotChat agentId={agentId} className="h-full flex flex-col" />
        </div>
      </div>
    </>
  )
}
