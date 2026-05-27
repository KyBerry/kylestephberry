import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export default function NotFound() {
  return (
    <Container variant="hero" as="section" className="py-32">
      <p className="mb-6 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
        404
      </p>
      <h1 className="text-4xl font-medium tracking-[-0.02em] text-(--color-fg) md:text-5xl">
        Not found
      </h1>
      <p className="mt-4 text-(--color-fg-muted)">
        That URL doesn&apos;t resolve to anything on this site.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
      >
        ← Back home
      </Link>
    </Container>
  )
}
