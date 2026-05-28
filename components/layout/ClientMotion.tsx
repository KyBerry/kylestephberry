'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

interface ClientMotionProps {
  children: ReactNode
}

type MotionLayerComponent = ComponentType<{ children: ReactNode }>

/**
 * Client-only entry point for motion + smooth scroll.
 *
 * Renders `children` directly on first paint (matching the SSR'd HTML
 * so content is fully indexable and visible immediately) and lazily
 * imports `MotionLayer` after hydration. `MotionLayer` pulls in
 * `motion` and `lenis`; deferring its load keeps both off the
 * critical-path bundle.
 *
 * Trade-off: when `MotionLayer` finishes loading it replaces this
 * subtree, which causes a one-time re-mount of `children`. That's
 * acceptable here because `children` has no client-side state on
 * initial paint (paths render server-side; interactive widgets
 * mount fresh anyway).
 */
export function ClientMotion({ children }: ClientMotionProps) {
  const [MotionLayer, setMotionLayer] = useState<MotionLayerComponent | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('./MotionLayer').then((mod) => {
      if (!cancelled) {
        setMotionLayer(() => mod.MotionLayer)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (MotionLayer) {
    return <MotionLayer>{children}</MotionLayer>
  }

  return <>{children}</>
}
