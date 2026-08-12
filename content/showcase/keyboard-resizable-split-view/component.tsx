'use client'

import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

const MIN_SPLIT = 28
const MAX_SPLIT = 72
const DEFAULT_SPLIT = 44
const ARROW_STEP = 2
const PAGE_STEP = 10
const SEPARATOR_WIDTH = 18

const clamp = (value: number) => Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value))

const OUTLINE = [
  'The happy path is only one sequence',
  'Eight states worth naming',
  'Give every state a behavioral contract',
  'Recovery is a design material',
] as const

export default function KeyboardResizableSplitView() {
  const [split, setSplit] = useState(DEFAULT_SPLIT)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const primaryId = useId()
  const secondaryId = useId()
  const instructionsId = useId()

  const roundedSplit = Math.round(split)

  function updateFromPointer(clientX: number) {
    const container = containerRef.current
    if (!container) return

    const bounds = container.getBoundingClientRect()
    const availableWidth = Math.max(bounds.width - SEPARATOR_WIDTH, 1)
    const leftWidth = clientX - bounds.left - SEPARATOR_WIDTH / 2
    setSplit(clamp((leftWidth / availableWidth) * 100))
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingRef.current = true
    setDragging(true)
    updateFromPointer(event.clientX)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    updateFromPointer(event.clientX)
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = false
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleLostPointerCapture() {
    draggingRef.current = false
    setDragging(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let nextSplit = split

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextSplit = split - ARROW_STEP
        break
      case 'ArrowRight':
      case 'ArrowUp':
        nextSplit = split + ARROW_STEP
        break
      case 'PageDown':
        nextSplit = split - PAGE_STEP
        break
      case 'PageUp':
        nextSplit = split + PAGE_STEP
        break
      case 'Home':
        nextSplit = MIN_SPLIT
        break
      case 'End':
        nextSplit = MAX_SPLIT
        break
      default:
        return
    }

    event.preventDefault()
    setSplit(clamp(nextSplit))
  }

  function resetSplit() {
    setSplit(DEFAULT_SPLIT)
  }

  return (
    <section className="mx-auto w-[680px] max-w-full overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) px-4 py-2.5">
        <p id={instructionsId} className="text-xs text-(--color-fg-muted)">
          <span className="hidden sm:inline">
            Resize the outline with the divider or arrow keys.
          </span>
          <span className="sm:hidden">Outline and draft stack at this width.</span>
        </p>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden font-mono text-[10px] text-(--color-fg-subtle) tabular-nums sm:block"
          >
            Outline {roundedSplit}%
          </span>
          <span className="font-mono text-[10px] text-(--color-fg-subtle) sm:hidden">Stacked</span>
          <button
            type="button"
            onClick={resetSplit}
            disabled={split === DEFAULT_SPLIT}
            className="rounded-md border border-(--color-border) px-2.5 py-1.5 text-xs text-(--color-fg-muted) transition-colors enabled:hover:border-(--color-border-strong) enabled:hover:text-(--color-fg) disabled:cursor-default disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-[296px] flex-col bg-(--color-border) sm:grid"
        style={{
          gridTemplateColumns: `minmax(0, ${split}fr) ${SEPARATOR_WIDTH}px minmax(0, ${
            100 - split
          }fr)`,
        }}
      >
        <section
          id={primaryId}
          aria-labelledby={`${primaryId}-title`}
          className="min-w-0 border-b border-(--color-border) bg-(--color-surface) px-4 py-5 sm:border-b-0"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={`${primaryId}-title`} className="text-sm font-medium text-(--color-fg)">
              Outline
            </h2>
            <span className="font-mono text-[10px] text-(--color-fg-subtle)">
              {OUTLINE.length} sections
            </span>
          </div>

          <ol className="mt-4 border-y border-(--color-border)">
            {OUTLINE.map((heading, index) => (
              <li
                key={heading}
                aria-current={index === 1 ? 'location' : undefined}
                className="grid grid-cols-[24px_1fr] gap-2 border-b border-(--color-border) py-3 ps-2 last:border-b-0"
              >
                <span
                  className={`font-mono text-[9px] ${
                    index === 1 ? 'text-(--color-accent)' : 'text-(--color-fg-subtle)'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`text-xs leading-snug ${
                    index === 1 ? 'font-medium text-(--color-fg)' : 'text-(--color-fg-muted)'
                  }`}
                >
                  {heading}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div
          role="separator"
          tabIndex={0}
          aria-label="Resize outline and draft panels"
          aria-orientation="vertical"
          aria-valuemin={MIN_SPLIT}
          aria-valuemax={MAX_SPLIT}
          aria-valuenow={roundedSplit}
          aria-valuetext={`${roundedSplit}% outline, ${100 - roundedSplit}% draft`}
          aria-controls={`${primaryId} ${secondaryId}`}
          aria-describedby={instructionsId}
          title="Drag to resize. Double-click to reset."
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={handleLostPointerCapture}
          onDoubleClick={resetSplit}
          className="group hidden cursor-col-resize touch-none items-center justify-center bg-(--color-surface) outline-none select-none focus-visible:bg-(--color-accent-soft) focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset sm:flex"
        >
          <span
            aria-hidden="true"
            className={`h-10 w-px transition-colors group-hover:bg-(--color-accent) ${
              dragging ? 'bg-(--color-accent)' : 'bg-(--color-border-strong)'
            }`}
          />
        </div>

        <article
          id={secondaryId}
          aria-labelledby={`${secondaryId}-title`}
          className="min-w-0 bg-(--color-bg) p-5"
        >
          <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            Draft excerpt
          </p>
          <h2 id={`${secondaryId}-title`} className="mt-2 text-lg font-medium text-(--color-fg)">
            QA taught me to design the states nobody demos
          </h2>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-(--color-fg-muted)">
            A list looks finished when it contains five tidy rows. Its design is unfinished until it
            can distinguish “we have not asked yet,” “we asked and found nothing,” and “we asked but
            could not get an answer.”
          </p>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-(--color-fg-muted)">
            Those conditions may occupy the same rectangle, but they do not mean the same thing and
            should not offer the same next action.
          </p>
          <blockquote className="mt-4 max-w-md text-xs leading-relaxed font-medium text-(--color-fg)">
            What does the person know? What can they safely do? What will the system preserve?
          </blockquote>
        </article>
      </div>
    </section>
  )
}
