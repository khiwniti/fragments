'use client'

import { FragmentCode } from './fragment-code'
import { ResumeArtifact } from './resume-artifact'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ResumeContentSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { ChevronsRight, LoaderCircle, Printer } from 'lucide-react'
import { Dispatch, SetStateAction, useCallback } from 'react'

export function ResumePreview({
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  content,
  onClose,
}: {
  selectedTab: 'preview' | 'data'
  onSelectedTabChange: Dispatch<SetStateAction<'preview' | 'data'>>
  isChatLoading: boolean
  content?: DeepPartial<ResumeContentSchema>
  onClose: () => void
}) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'preview' | 'data')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 grid grid-cols-3 items-center border-b print:hidden">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={onClose}
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="preview"
              >
                {isChatLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                Preview
              </TabsTrigger>
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="data"
              >
                Data
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center justify-end gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print / PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="overflow-y-auto w-full h-full">
          <TabsContent value="preview" className="h-full mt-0">
            <ResumeArtifact content={content} isLoading={isChatLoading} />
          </TabsContent>
          <TabsContent value="data" className="h-full mt-0">
            <FragmentCode
              files={[
                {
                  name: 'resume.json',
                  content: JSON.stringify(content ?? {}, null, 2),
                },
              ]}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
