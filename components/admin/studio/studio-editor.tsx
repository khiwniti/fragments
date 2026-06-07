'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Code,
  Quote,
  Wand2,
  Sparkles,
  Type,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface StudioEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

// Slash menu items
const slashCommands = [
  { title: 'Heading 1', icon: Heading1, command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: 'Heading 2', icon: Heading2, command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: 'Heading 3', icon: Heading3, command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: 'Bullet List', icon: List, command: (editor: Editor) => editor.chain().focus().toggleBulletList().run() },
  { title: 'Numbered List', icon: ListOrdered, command: (editor: Editor) => editor.chain().focus().toggleOrderedList().run() },
  { title: 'Task List', icon: CheckSquare, command: (editor: Editor) => editor.chain().focus().toggleTaskList().run() },
  { title: 'Quote', icon: Quote, command: (editor: Editor) => editor.chain().focus().toggleBlockquote().run() },
  { title: 'Code Block', icon: Code, command: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run() },
]

const aiCommands = [
  { title: 'Improve writing', prompt: 'Improve this text to be more clear and engaging. Keep the original language.' },
  { title: 'Make shorter', prompt: 'Make this text shorter and more concise. Keep the original language.' },
  { title: 'Make longer', prompt: 'Expand this text with more detail and depth. Keep the original language.' },
  { title: 'Fix grammar', prompt: 'Fix grammar and spelling errors in this text. Keep the original language.' },
  { title: 'Simplify', prompt: 'Simplify this text for a general audience. Keep the original language.' },
]

/* ------------------------------------------------------------------
   Custom BubbleMenu — shows when text is selected
   ------------------------------------------------------------------ */
function CustomBubbleMenu({
  editor,
  show,
  onShowAI,
  aiLoading,
  children,
}: {
  editor: Editor | null
  show: boolean
  onShowAI: (v: boolean) => void
  aiLoading: boolean
  children: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const update = () => {
      const { from, to, empty } = editor.state.selection
      if (empty || aiLoading) {
        setVisible(false)
        return
      }
      const coords = editor.view.coordsAtPos(from)
      const rect = editor.view.dom.getBoundingClientRect()
      setPos({
        top: coords.top - rect.top - 48,
        left: coords.left - rect.left,
      })
      setVisible(true)
    }

    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', () => setVisible(false))
    update()

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('focus', update)
      editor.off('blur', () => setVisible(false))
    }
  }, [editor, aiLoading])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-50 transition-opacity"
      style={{
        top: pos.top,
        left: Math.max(8, Math.min(pos.left, (editor?.view.dom.clientWidth || 600) - 280)),
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------
   Custom FloatingMenu — shows on empty lines
   ------------------------------------------------------------------ */
function CustomFloatingMenu({
  editor,
  children,
}: {
  editor: Editor | null
  children: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!editor) return

    const update = () => {
      const { from, empty } = editor.state.selection
      const node = editor.state.doc.nodeAt(from)
      const isEmptyLine = empty && (!node || node.isTextblock && node.content.size === 0)

      if (isEmptyLine) {
        const coords = editor.view.coordsAtPos(from)
        const rect = editor.view.dom.getBoundingClientRect()
        setPos({
          top: coords.top - rect.top + 4,
          left: coords.left - rect.left + 4,
        })
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', () => setVisible(false))
    update()

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('focus', update)
      editor.off('blur', () => setVisible(false))
    }
  }, [editor])

  if (!visible) return null

  return (
    <div
      className="absolute z-50"
      style={{
        top: pos.top,
        left: Math.max(8, pos.left),
      }}
    >
      {children}
    </div>
  )
}

export function StudioEditor({ content, onChange, placeholder = 'Start writing...' }: StudioEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })
  const [aiLoading, setAiLoading] = useState(false)
  const [showBubbleAI, setShowBubbleAI] = useState(false)
  const [urlDialog, setUrlDialog] = useState<{ open: boolean; mode: 'link' | 'image'; value: string }>({
    open: false,
    mode: 'link',
    value: '',
  })
  const slashMenuRef = useRef<HTMLDivElement>(null)
  const bubbleMenuRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      checkSlashMenu(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      checkSlashMenu(editor)
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (slashMenuOpen) {
          if (event.key === 'Escape') {
            setSlashMenuOpen(false)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            const items = getFilteredSlashItems(slashQuery)
            if (items.length > 0) {
              items[0].command(editor)
              setSlashMenuOpen(false)
            }
            return true
          }
        }
        return false
      },
    },
  })

  function checkSlashMenu(editorInstance: Editor | null) {
    if (!editorInstance) return
    const { from } = editorInstance.state.selection
    const textBefore = editorInstance.state.doc.textBetween(Math.max(0, from - 20), from, '\n')
    const match = textBefore.match(/\/(\w*)$/)

    if (match) {
      setSlashQuery(match[1].toLowerCase())
      setSlashMenuOpen(true)
      const coords = editorInstance.view.coordsAtPos(from)
      setSlashMenuPos({ top: coords.top + 24, left: coords.left })
    } else {
      setSlashMenuOpen(false)
    }
  }

  function getFilteredSlashItems(query: string) {
    if (!query) return slashCommands
    return slashCommands.filter((item) =>
      item.title.toLowerCase().includes(query)
    )
  }

  async function handleAIAction(prompt: string) {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    if (!selectedText) return

    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, instruction: prompt }),
      })

      if (res.ok) {
        const reader = res.body?.getReader()
        if (!reader) return

        let result = ''
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += decoder.decode(value, { stream: true })
        }
        result += decoder.decode()

        // Clean up the streamed result
        const cleanResult = result
          .replace(/^data: /gm, '')
          .replace(/\n/g, '')
          .trim()

        editor.chain().focus().insertContentAt({ from, to }, cleanResult).run()
      }
    } catch (error) {
      console.error('AI edit failed:', error)
    } finally {
      setAiLoading(false)
      setShowBubbleAI(false)
    }
  }

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    setUrlDialog({ open: true, mode: 'link', value: previousUrl || '' })
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    setUrlDialog({ open: true, mode: 'image', value: '' })
  }, [editor])

  function handleUrlDialogSubmit() {
    if (!editor) return
    const url = urlDialog.value.trim()
    if (urlDialog.mode === 'link') {
      if (!url) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }
    } else {
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
    setUrlDialog({ open: false, mode: 'link', value: '' })
  }

  if (!editor) {
    return <div className="rounded-lg border border-border bg-card p-8 min-h-[300px] animate-pulse" />
  }

  const toolbarButtons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight') },
    null,
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    null,
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList') },
    null,
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), active: editor.isActive({ textAlign: 'left' }) },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: editor.isActive({ textAlign: 'center' }) },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), active: editor.isActive({ textAlign: 'right' }) },
    null,
    { icon: LinkIcon, action: setLink, active: editor.isActive('link') },
    { icon: ImageIcon, action: addImage, active: false },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') },
  ]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        {toolbarButtons.map((btn, i) =>
          btn === null ? (
            <div key={i} className="w-px h-6 bg-border mx-1" />
          ) : (
            <Button
              key={i}
              variant={btn.active ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={btn.action}
            >
              <btn.icon className="w-4 h-4" />
            </Button>
          )
        )}
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-invert max-w-none p-6 min-h-[300px] focus:outline-none studio-editor"
        />

        {/* Slash menu */}
        {slashMenuOpen && (
          <div
            ref={slashMenuRef}
            className="fixed z-50 w-56 rounded-lg border border-border bg-popover shadow-lg py-1"
            style={{ top: slashMenuPos.top, left: slashMenuPos.left }}
          >
            {getFilteredSlashItems(slashQuery).map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  item.command(editor)
                  setSlashMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                {item.title}
              </button>
            ))}
            {getFilteredSlashItems(slashQuery).length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No commands found</div>
            )}
          </div>
        )}

        {/* Custom Bubble Menu */}
        <CustomBubbleMenu editor={editor} show={showBubbleAI} onShowAI={setShowBubbleAI} aiLoading={aiLoading}>
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-popover shadow-lg">
            {showBubbleAI ? (
              <div ref={bubbleMenuRef} className="flex flex-col gap-1 p-1 min-w-[180px]">
                {aiCommands.map((cmd) => (
                  <button
                    key={cmd.title}
                    onClick={() => handleAIAction(cmd.prompt)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    {cmd.title}
                  </button>
                ))}
                <button
                  onClick={() => setShowBubbleAI(false)}
                  className="text-xs text-muted-foreground px-3 py-1 hover:text-foreground"
                >
                  Back
                </button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => setShowBubbleAI(true)}
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  AI
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()}>
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()}>
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleHighlight().run()}>
                  <Highlighter className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={setLink}>
                  <LinkIcon className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </CustomBubbleMenu>

        {/* Custom Floating Menu for empty lines */}
        <CustomFloatingMenu editor={editor}>
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-popover shadow-lg">
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Type className="w-3.5 h-3.5" />
              Heading
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addImage}>
              <ImageIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CustomFloatingMenu>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-b-xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            AI is editing...
          </div>
        </div>
      )}

      {/* URL/Image input dialog (replaces window.prompt) */}
      <Dialog
        open={urlDialog.open}
        onOpenChange={(open) => setUrlDialog((d) => ({ ...d, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{urlDialog.mode === 'link' ? 'Add link' : 'Add image'}</DialogTitle>
            <DialogDescription>
              {urlDialog.mode === 'link'
                ? 'Enter the URL. Leave blank to remove the link.'
                : 'Enter the image URL.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="url-dialog-input">URL</Label>
            <Input
              id="url-dialog-input"
              autoFocus
              value={urlDialog.value}
              onChange={(e) => setUrlDialog((d) => ({ ...d, value: e.target.value }))}
              placeholder="https://..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleUrlDialogSubmit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUrlDialog({ open: false, mode: 'link', value: '' })}
            >
              Cancel
            </Button>
            <Button onClick={handleUrlDialogSubmit}>
              {urlDialog.mode === 'link' ? (urlDialog.value.trim() ? 'Set link' : 'Remove link') : 'Add image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
