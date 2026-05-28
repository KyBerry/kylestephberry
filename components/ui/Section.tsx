import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/utils/cn'

interface SectionProps {
  eyebrow: string
  heading: string
  intro?: string
  seeAllHref?: string
  seeAllLabel?: string
  containerVariant?: 'prose' | 'grid' | 'hero'
  className?: string
  children: ReactNode
}

export function Section({
  eyebrow,
  heading,
  intro,
  seeAllHref,
  seeAllLabel = 'See all',
  containerVariant = 'grid',
  className,
  children,
}: SectionProps) {
  return (
    <Container as="section" variant={containerVariant} className={cn('py-16 md:py-24', className)}>
      <header className="mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="mb-3 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-medium tracking-[-0.02em] text-balance text-(--color-fg) md:text-4xl">
            {heading}
          </h2>
          {intro ? (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-(--color-fg-muted)">
              {intro}
            </p>
          ) : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="group inline-flex shrink-0 items-center gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
          >
            {seeAllLabel}
            <ArrowRight
              weight="regular"
              size={14}
              className="-translate-x-0.5 transition-transform group-hover:translate-x-0"
            />
          </Link>
        ) : null}
      </header>
      {children}
    </Container>
  )
}
