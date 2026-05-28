'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ScaledStageProps {
  children: ReactNode
  /** Never enlarge past this; default 1 (shrink-only — upscaling blurs small UI). */
  maxScale?: number
  /** px gap between scaled content and stage edges; default 24. */
  inset?: number
  /**
   * Floor for the content's natural layout width, in px. Components with no
   * `max-w-*` and no intrinsic width (e.g. metric-dashboard's bare
   * `grid grid-cols-2`) would otherwise shrink-wrap to a cramped column under
   * `w-fit`; pinning a sensible base width lets them lay out properly, then the
   * whole thing scales down to fit. Default 0 (off) so components that already
   * size themselves are untouched.
   */
  minWidth?: number
  /** false → pointer-events-none (visual-only); default true. */
  interactive?: boolean
  className?: string
}

/**
 * Scale-to-fit preview wrapper. Renders `children` at their natural size, then
 * applies a CSS `transform: scale()` so the whole component fits the stage,
 * centered — large components (e.g. a 768px `max-w-3xl` table) shrink to be
 * fully visible instead of being center-cropped, while small ones (a button)
 * stay at 1:1.
 *
 * Why this works: `transform: scale()` is a paint-time effect — it does NOT
 * change the element's layout box, so `offsetWidth/offsetHeight` keep reporting
 * the *natural* (unscaled) size even while a scale is applied. We measure that,
 * compare to the available stage box, and pick the fitting ratio.
 */
export function ScaledStage({
  children,
  maxScale = 1,
  inset = 24,
  minWidth = 0,
  interactive = true,
  className,
}: ScaledStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  const measure = useCallback(() => {
    const stage = stageRef.current
    const content = contentRef.current
    if (!stage || !content) return
    // offsetWidth/Height are LAYOUT dims — unaffected by the transform, so they
    // give the natural (unscaled) size even while a scale is applied.
    const nW = content.offsetWidth
    const nH = content.offsetHeight
    if (!nW || !nH) return
    const availW = stage.clientWidth - inset * 2
    const availH = stage.clientHeight - inset * 2
    const next = Math.min(availW / nW, availH / nH, maxScale)
    setScale(next > 0 ? next : 1)
  }, [inset, maxScale])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (stageRef.current) ro.observe(stageRef.current)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [measure])

  return (
    <div
      ref={stageRef}
      className={cn('relative grid h-full w-full place-items-center overflow-hidden', className)}
    >
      <div
        ref={contentRef}
        className={cn('w-fit', !interactive && 'preview-static pointer-events-none')}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          minWidth: minWidth || undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
