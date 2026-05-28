'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export function LenisProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    // Lenis hijacks wheel/touch globally to smooth the PAGE scroll. Without
    // this, wheel events over a nested scroll region (the table viewport, the
    // chat panel, the command list, the code pane) scroll the page instead of
    // the region — i.e. "the table doesn't scroll". `prevent` tells Lenis to
    // leave events alone when they originate inside any element marked as an
    // internal scroll region (our `scrollbar-thin` utility) or `data-lenis-prevent`.
    const lenis = new Lenis({
      lerp: 0.1,
      // Lenis walks the event path, which includes non-Element nodes (document,
      // window) — guard with `instanceof Element` before touching DOM methods.
      prevent: (node) =>
        node instanceof Element &&
        (node.classList.contains('scrollbar-thin') || node.hasAttribute('data-lenis-prevent')),
    })
    let raf = 0
    function tick(t: number) {
      lenis.raf(t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
