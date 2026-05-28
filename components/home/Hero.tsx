'use client'

import { useEffect, useRef } from 'react'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { site } from '@/lib/site'

// How much slower the heading block moves than the page (spec: "~0.3×").
const PARALLAX_FACTOR = 0.3
// Clamp so the block never drifts unreasonably far on a long scroll.
const MAX_OFFSET = 120

/**
 * Home hero with a gentle scroll parallax on the eyebrow/name block (spec:
 * "hero parallax").
 *
 * The heading translates upward at ~0.3× the scroll speed so it drifts slightly
 * behind the surrounding content as the page scrolls.
 *
 * Implemented with a passive scroll listener writing a transform inside rAF
 * rather than motion's `useScroll`/`useTransform`: the home route already
 * defers `motion` to a post-hydration chunk (MotionLayer), and importing it
 * directly here would pull the full animation runtime into `/`'s initial
 * bundle. A few lines of native code keep `/` lean and let the above-the-fold
 * effect run immediately without waiting on a lazy chunk. The rendered markup
 * is unchanged from the server output, so the hero is fully indexable.
 *
 * `prefers-reduced-motion` disables the transform entirely.
 */
export function Hero() {
  const headingRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = headingRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const offset = Math.min(window.scrollY * PARALLAX_FACTOR, MAX_OFFSET)
      node.style.transform = `translate3d(0, ${-offset}px, 0)`
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      node.style.transform = ''
    }
  }, [])

  return (
    <Container variant="hero" as="section" className="pt-24 pb-12 md:pt-32 md:pb-16">
      <div ref={headingRef} className="will-change-transform">
        <p className="mb-6 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          {site.role}
        </p>

        <h1 className="text-5xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-6xl">
          {site.name}
        </h1>
      </div>

      <p className="mt-6 max-w-prose text-lg leading-relaxed text-pretty text-(--color-fg-muted)">
        {site.shortBio}
      </p>

      <nav className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {site.socials.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
          >
            {s.label}
            <ArrowUpRight
              weight="regular"
              size={12}
              className="translate-y-px opacity-60 transition-opacity group-hover:opacity-100"
            />
          </a>
        ))}
      </nav>
    </Container>
  )
}
