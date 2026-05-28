'use client'

import { type ReactNode, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowsOut, X } from '@phosphor-icons/react/dist/ssr'

interface FullscreenStageProps {
  title: string
  children: ReactNode
}

export function FullscreenStage({ title, children }: FullscreenStageProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open fullscreen"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-(--color-fg-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-fg)"
        >
          <ArrowsOut weight="regular" size={14} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-40 bg-(--color-bg)/80 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 fixed inset-4 z-50 flex flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-(--color-border) px-4 py-2">
            <Dialog.Title className="font-mono text-xs text-(--color-fg-muted)">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close fullscreen"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg)"
              >
                <X weight="regular" size={14} />
              </button>
            </Dialog.Close>
          </div>
          <div className="grid flex-1 place-items-center overflow-auto bg-(--color-bg) p-8">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
