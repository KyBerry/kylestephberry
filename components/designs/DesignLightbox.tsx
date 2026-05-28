'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from '@phosphor-icons/react/dist/ssr'
import type { Design } from 'content-collections'

interface DesignLightboxProps {
  /** The currently-open design, or null when closed. */
  open: Design | null
  onClose: () => void
  /** Callbacks fire when the user navigates within the current filter set. */
  onPrev: () => void
  onNext: () => void
  /** Whether prev/next are available (based on position in the filtered list). */
  hasPrev: boolean
  hasNext: boolean
}

export function DesignLightbox({
  open,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: DesignLightboxProps) {
  const isOpen = open !== null

  // Keyboard navigation while open
  useEffect(() => {
    if (!isOpen) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [isOpen, hasPrev, hasNext, onPrev, onNext])

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-(--color-bg)/85 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {open ? (
            <>
              <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-(--color-fg-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-fg)"
                  >
                    <X weight="regular" size={16} />
                  </button>
                </Dialog.Close>
              </div>

              <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
                {/* Prev / next */}
                <button
                  type="button"
                  aria-label="Previous design"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="absolute top-1/2 left-4 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface)/80 text-(--color-fg-muted) backdrop-blur transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg) disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-(--color-border) disabled:hover:text-(--color-fg-muted)"
                >
                  <ArrowLeft weight="regular" size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next design"
                  onClick={onNext}
                  disabled={!hasNext}
                  className="absolute top-1/2 right-4 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface)/80 text-(--color-fg-muted) backdrop-blur transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg) disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-(--color-border) disabled:hover:text-(--color-fg-muted)"
                >
                  <ArrowRight weight="regular" size={16} />
                </button>

                <div className="relative flex max-h-[80vh] max-w-[90vw] items-center justify-center">
                  <Image
                    key={open.slug}
                    src={open.image}
                    alt={open.imageAlt}
                    width={open.imageWidth}
                    height={open.imageHeight}
                    placeholder="blur"
                    blurDataURL={open.blurDataURL}
                    sizes="90vw"
                    className="max-h-[80vh] w-auto rounded border border-(--color-border) object-contain"
                  />
                </div>
              </div>

              <footer className="mx-auto w-full max-w-(--container-grid) shrink-0 px-6 pt-2 pb-6 md:px-8">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-lg font-medium text-(--color-fg)">
                      {open.title}
                    </Dialog.Title>
                    {open.summary ? (
                      <p className="mt-1 text-sm text-(--color-fg-muted)">{open.summary}</p>
                    ) : null}
                  </div>
                  {open.figmaUrl ? (
                    <a
                      href={open.figmaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex shrink-0 items-center gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
                    >
                      Open in Figma
                      <ArrowUpRight
                        weight="regular"
                        size={12}
                        className="opacity-60 transition-opacity group-hover:opacity-100"
                      />
                    </a>
                  ) : null}
                </div>
                {open.tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {open.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded border border-(--color-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-(--color-fg-muted)"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </footer>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
