'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Conversation } from './chat-panel/conversation'

interface PullUpChatProps {
  agentId: string
  title: string
  description: string
  defaultHeight?: number
  initialPrompt?: string
}

export function PullUpChat({ agentId, title, description, defaultHeight = 50, initialPrompt }: PullUpChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [height, setHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dragStartRef = useRef<{ y: number; height: number }>({ y: 0, height: defaultHeight })

  // --- Escape key to close ---
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  // --- Body scroll lock ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // --- Auto-focus close button on open ---
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // --- Shared drag start ---
  const dragStart = useCallback((clientY: number, currentHeight: number) => {
    setIsDragging(true)
    dragStartRef.current = { y: clientY, height: currentHeight }
  }, [height])

  // --- Shared drag move ---
  const dragMove = useCallback((clientY: number) => {
    if (!isDragging) return
    const deltaY = dragStartRef.current.y - clientY
    const newHeight = Math.min(85, Math.max(20, dragStartRef.current.height + (deltaY / window.innerHeight) * 100))
    setHeight(newHeight)
  }, [isDragging])

  // --- Shared drag end ---
  const dragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // --- Mouse handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStart(e.clientY, height)
    e.preventDefault()
  }, [height, dragStart])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => dragMove(e.clientY)
    const handleMouseUp = () => dragEnd()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragMove, dragEnd])

  // --- Touch handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStart(e.touches[0].clientY, height)
  }, [height, dragStart])

  useEffect(() => {
    if (!isDragging) return
    const handleTouchMove = (e: TouchEvent) => {
      // Allow some vertical scroll inside the chat body before dragging kicks in
      dragMove(e.touches[0].clientY)
    }
    const handleTouchEnd = () => dragEnd()
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragMove, dragEnd])

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
      {isOpen && (
        <div
          className="chat-drawer-backdrop md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`chat-drawer md:hidden ${isOpen ? 'open' : 'closed'} ${isDragging ? 'dragging' : ''}`}
        style={{ height: `${height}vh` }}
      >
        {/* Drag handle */}
        <div
          className="chat-drawer-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
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
            ref={closeRef}
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
          <Conversation agentId={agentId} initialPrompt={initialPrompt} />
        </div>
      </div>
    </>
  )
}
