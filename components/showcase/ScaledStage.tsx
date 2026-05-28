'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ScaledStageProps {
  children: ReactNode
  /**
   * Cap on the fit scale. Allows MODEST upscaling (default 1.25) so a small
   * component (a button) isn't a lost dot in a big card, without blowing it up.
   */
  maxScale?: number
  /** px padding between content and stage edges; default 20. */
  inset?: number
  /** false → pointer-events-none (visual-only); default true. */
  interactive?: boolean
  className?: string
}

/**
 * Preview stage for the component grid cards.
 *
 * Strategy (chosen after seeing real renders): fit to WIDTH for legibility,
 * not to the whole box. Scaling tall components down to fully fit makes them
 * illegibly tiny and gives every card a different visual weight. Instead:
 *
 *   - scale = min(availWidth / naturalWidth, maxScale), the component fills
 *     the card width at a readable size; small components upscale modestly.
 *   - if the scaled height fits, center it.
 *   - if it's taller than the card, top-align and fade the cropped bottom edge
 *     so it reads as an intentional "peek" (header/first content visible), the
 *     way polished component galleries preview large surfaces. The full,
 *     interactive component lives on the detail page.
 *
 * `transform: scale()` is paint-only, so `offsetWidth/Height` keep reporting
 * the natural (unscaled) size for measurement. The content wrapper is `w-max`
 * (max-content) so `w-full`/`max-w-*` components lay out at their true width
 * instead of collapsing to the stage width.
 */
export function ScaledStage({
  children,
  maxScale = 1.25,
  inset = 20,
  interactive = true,
  className,
}: ScaledStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [overflowing, setOverflowing] = useState(false)

  const measure = useCallback(() => {
    const stage = stageRef.current
    const content = contentRef.current
    if (!stage || !content) return
    const naturalW = content.offsetWidth
    const naturalH = content.offsetHeight
    if (!naturalW || !naturalH) return
    const availW = stage.clientWidth - inset * 2
    const availH = stage.clientHeight - inset * 2
    const next = Math.min(availW / naturalW, maxScale)
    const resolved = next > 0 ? next : 1
    setScale(resolved)
    setOverflowing(naturalH * resolved > availH)
  }, [inset, maxScale])

  useEffect(() => {
    // Measure once after layout (poster fit on first paint) and again only when
    // the STAGE (card) resizes. The content node is deliberately NOT observed:
    // live demos inside animate (count-up, AI typing) and mutate every frame,
    // which would otherwise re-fire measure continuously. Content natural size
    // is read inside measure via contentRef, but its mutations don't trigger it.
    measure()
    const ro = new ResizeObserver(measure)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [measure])

  const fadeMask = 'linear-gradient(to bottom, #000 72%, transparent)'

  return (
    <div
      ref={stageRef}
      className={cn(
        'relative flex h-full w-full justify-center overflow-hidden',
        overflowing ? 'items-start' : 'items-center',
        className,
      )}
      style={{
        padding: inset,
        maskImage: overflowing ? fadeMask : undefined,
        WebkitMaskImage: overflowing ? fadeMask : undefined,
      }}
    >
      <div
        ref={contentRef}
        className={cn('w-max shrink-0', !interactive && 'preview-static pointer-events-none')}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: overflowing ? 'top center' : 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
