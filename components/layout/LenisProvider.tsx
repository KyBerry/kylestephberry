'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export function LenisProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const lenis = new Lenis({ lerp: 0.1 })
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
