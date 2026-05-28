'use client'

import type { ReactNode } from 'react'

import { LenisProvider } from './LenisProvider'
import { PageTransition } from './PageTransition'

interface MotionLayerProps {
  children: ReactNode
}

/**
 * Concrete client-side composition of the motion layer.
 *
 * Lives in its own module so `next/dynamic({ ssr: false })` in
 * `ClientMotion` can code-split it out of the initial bundle,
 * neither `lenis` nor `motion` is loaded until this chunk arrives
 * on the client.
 */
export function MotionLayer({ children }: MotionLayerProps) {
  return (
    <>
      <LenisProvider />
      <PageTransition>{children}</PageTransition>
    </>
  )
}

export default MotionLayer
