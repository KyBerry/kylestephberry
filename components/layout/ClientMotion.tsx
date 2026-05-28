'use client'

import type { ReactNode } from 'react'

import { LenisProvider } from './LenisProvider'
import { PageTransition } from './PageTransition'

interface ClientMotionProps {
  children: ReactNode
}

/**
 * Single client-side entry point for motion + smooth scroll.
 *
 * Mounts Lenis (smooth-scroll RAF loop, auto-disabled on
 * `prefers-reduced-motion`) and wraps page content in `PageTransition`
 * (motion/react `AnimatePresence` fade/slide between routes).
 *
 * Imported lazily via `next/dynamic({ ssr: false })` from
 * `app/layout.tsx` so neither `lenis` nor `motion` ship in the
 * server-rendered HTML or the initial JS bundle.
 */
export function ClientMotion({ children }: ClientMotionProps) {
  return (
    <>
      <LenisProvider />
      <PageTransition>{children}</PageTransition>
    </>
  )
}
