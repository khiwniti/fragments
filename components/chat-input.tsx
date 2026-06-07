'use client'

import { RepoBanner } from './repo-banner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isFileInArray } from '@/lib/utils'
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import { SetStateAction, useEffect, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILE_COUNT = 12

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ChatInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
  isResumeMode,
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  children: React.ReactNode
  isResumeMode?: boolean
}) {
  const [fileError, setFileError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  function validateAndAppend(raw: File[]) {
    const accepted: File[] = []
    let firstError: string | null = null
    for (const file of raw) {
      if (file.size > MAX_FILE_BYTES) {
        if (!firstError) firstError = `${file.name} is larger than 5MB.`
        continue
      }
      accepted.push(file)
    }
    if (firstError) {
      setFileError(firstError)
    } else {
      setFileError(null)
    }
    handleFileChange((prev) => {
      const next = [...prev, ...accepted.filter((f) => !isFileInArray(f, prev))]
      return next.slice(0, MAX_FILE_COUNT)
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndAppend(Array.from(e.target.files || []))
  }

  function handleFileRemove(file: File) {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()

        const file = item.getAsFile()
        if (file) {
          validateAndAppend([file])
        }
      }
    }
  }

  const [dragActive, setDragActive] = useState(false)

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )
    validateAndAppend(droppedFiles)
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
      return
    }
    let cancelled = false
    Promise.all(files.map(readAsDataUrl))
      .then((urls) => {
        if (!cancelled) setPreviewUrls(urls)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrls([])
      })
    return () => {
      cancelled = true
    }
  }, [files, isMultiModal, handleFileChange])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    if (e.shiftKey) return
    const isShortcut = e.metaKey || e.ctrlKey
    if (!isShortcut && e.key === 'Enter') {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
      return
    }
    if (isShortcut) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal, handleFileChange])

  const showError = isErrored || fileError
  const errorText = fileError || errorMessage
  const errorIsRate = isRateLimited && !fileError

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 mt-auto flex flex-col bg-background"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
    >
      {showError && (
        <div
          role="alert"
          className={`flex items-center p-1.5 text-sm font-medium mx-4 mb-2 rounded-xl ${
            errorIsRate
              ? 'bg-orange-400/10 text-orange-400'
              : 'bg-red-400/10 text-red-400'
          }`}
        >
          <span className="flex-1 px-1.5">{errorText}</span>
          <button
            type="button"
            className={`px-2 py-1 rounded-sm ${
              errorIsRate ? 'bg-orange-400/20' : 'bg-red-400/20'
            }`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}
      <div className="relative">
        {!isResumeMode && (
          <RepoBanner className="absolute bottom-full inset-x-2 translate-y-1 z-0 pb-2" />
        )}
        <div
          className={`shadow-md rounded-2xl relative z-10 bg-background border ${
            dragActive
              ? 'before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary'
              : ''
          }`}
        >
          <div className="flex items-center px-3 py-2 gap-1">{children}</div>
          <TextareaAutosize
            minRows={1}
            maxRows={12}
            className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none max-h-[40vh]"
            required={true}
            placeholder={isResumeMode ? "Ask about experience, skills, or projects..." : "Describe your app..."}
            disabled={isErrored}
            value={input}
            onChange={handleInputChange}
            onPaste={isMultiModal ? handlePaste : undefined}
          />
          <div className="flex p-3 gap-2 items-center">
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              accept="image/*"
              multiple={true}
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex items-center flex-1 gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!isMultiModal || isErrored}
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('multimodal')?.click()
                      }}
                      aria-label="Add attachments"
                    >
                      <Paperclip className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add attachments</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <div className="relative" key={`${file.name}-${i}`}>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(file)}
                        aria-label={`Remove ${file.name}`}
                        className="absolute -top-2 -right-2 bg-secondary border border-border rounded-full p-1 hover:bg-accent transition-colors"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                      {previewUrls[i] ? (
                        <img
                          src={previewUrls[i]}
                          alt={file.name}
                          className="rounded-xl w-10 h-10 object-cover border border-border"
                        />
                      ) : (
                        <div className="rounded-xl w-10 h-10 bg-secondary border border-border" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              {!isLoading ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored}
                        variant="default"
                        size="icon"
                        type="submit"
                        className="rounded-xl h-10 w-10"
                        aria-label="Send message"
                      >
                        <ArrowUp className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message (Enter)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={(e) => {
                          e.preventDefault()
                          stop()
                        }}
                        aria-label="Stop generation"
                      >
                        <Square className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center font-mono tracking-wider uppercase">
        Built by{' '}
        <a href="https://khiw.dev" target="_blank" className="text-primary">
          khiw.dev
        </a>
        <span className="mx-1.5" aria-hidden="true">·</span>
        <span className="text-muted-foreground/70">Enter to send · Shift+Enter for newline</span>
      </p>
    </form>
  )
}
