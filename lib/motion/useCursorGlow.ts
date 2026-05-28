'use client'

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

interface CursorGlow {
  /** Attach to the glowing element to receive `--x` / `--y` writes. */
  glowRef: (node: HTMLElement | null) => void
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave: () => void
}

/**
 * Tracks the pointer inside a card and writes its position to `--x` / `--y`
 * CSS custom properties on the element. A sibling/pseudo layer reads those to
 * paint a radial accent glow that follows the cursor.
 *
 * Why CSS custom properties + native pointer events rather than motion's
 * `useSpring`: importing `motion` into ShowcaseCard would pull the full library
 * into the critical bundle for `/` and `/components` (today it's only
 * lazy-loaded post-hydration via MotionLayer). Direct style writes have zero
 * per-frame React/runtime overhead and no extra bundle weight; the glow's
 * opacity is eased with a plain CSS transition. The spec permits this
 * ("equivalently use CSS transitions for the glow opacity").
 *
 * Writes go straight to the DOM node (not React state) so pointer move never
 * triggers a re-render.
 */
export function useCursorGlow(): CursorGlow {
  const elementRef = useRef<HTMLElement | null>(null)

  const glowRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const node = elementRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--x', `${event.clientX - rect.left}px`)
    node.style.setProperty('--y', `${event.clientY - rect.top}px`)
  }, [])

  const onPointerLeave = useCallback(() => {
    // Park the glow centre-ish so the next hover doesn't flash in from a stale
    // corner before the first pointermove lands.
    const node = elementRef.current
    if (!node) return
    node.style.setProperty('--x', '50%')
    node.style.setProperty('--y', '50%')
  }, [])

  return { glowRef, onPointerMove, onPointerLeave }
}
