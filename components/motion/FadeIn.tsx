'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

// Restrained element union (mirrors <Container>'s `as`) rather than full
// polymorphism — these are the only wrappers grid items actually need.
type FadeInTag = 'div' | 'li' | 'section' | 'span'

interface FadeInProps {
  children: ReactNode
  /**
   * Stagger delay in ms, applied to the transition. Pass `index * 50` for
   * grids; the caller is responsible for capping it (see ShowcaseCard).
   */
  delay?: number
  /** Wrapper element. Defaults to `div`. */
  as?: FadeInTag
  className?: string
}

/**
 * Scroll-triggered fade + lift for grid items (spec: "in-view fade for grid
 * items").
 *
 * Mechanics:
 * - SSR renders the wrapper with `opacity-0` (per design spec). A one-off
 *   `<noscript>` style override forces it visible when JS is unavailable, so
 *   no-JS readers never get a permanently-invisible element.
 * - After hydration a native `IntersectionObserver` (same pattern as
 *   `ShowcaseCard`'s mount strategy) reveals the element the first time it
 *   enters the viewport, then disconnects (fires once).
 * - `prefers-reduced-motion` short-circuits to visible immediately with no
 *   transform or transition.
 *
 * Deliberately uses native IO rather than motion's `useInView` so it stays out
 * of any bundle that doesn't already pull in `motion`.
 */
export function FadeIn({ children, delay = 0, as: Tag = 'div', className }: FadeInProps) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Callback ref: wires up the observer the moment the node attaches (and tears
  // it down when React detaches it), sidestepping the variance mismatch between
  // the per-tag intrinsic ref types.
  const setRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node) return

    // Honour reduced-motion: reveal instantly, skip the observer entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    // IO always reports the node's initial intersection state on first
    // observation, so above-the-fold items reveal without a scroll. Fires once.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    observerRef.current = observer
  }, [])

  return (
    <Tag
      ref={setRef}
      data-fade-in=""
      className={cn(
        'motion-safe:transition-[opacity,transform] motion-safe:duration-[400ms] motion-safe:ease-(--ease-out-quad)',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {/*
        Safety net for the no-JS / scripting-disabled case: the wrapper SSRs at
        opacity-0 and only JS can reveal it, so without this a no-JS reader would
        see a permanently blank slot. The rule is idempotent (same selector +
        declaration each time) and parsed only when scripting is off, so emitting
        it per-instance costs nothing in the common JS-enabled path.
      */}
      <noscript>
        <style>{`[data-fade-in]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      {children}
    </Tag>
  )
}
