import { Suspense } from 'react'
import type { Metadata } from 'next'
import { allPosts } from 'content-collections'
import { Container } from '@/components/ui/Container'
import { PostsByYear } from '@/components/blog/PostsByYear'
import { latest, withoutMDXContent } from '@/lib/content/helpers'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Notes on design engineering, motion, and interface craft.',
}

export default function BlogIndexPage() {
  const all = latest(allPosts, allPosts.length).map(withoutMDXContent)

  return (
    <Container variant="grid" as="section" className="py-24 md:py-32">
      <header className="mb-12 md:mb-16">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-(--color-fg-subtle)">
          Writing
        </p>
        <h1 className="text-balance text-4xl font-medium tracking-[-0.025em] text-(--color-fg) md:text-5xl">
          Notes
        </h1>
        <p className="mt-4 text-(--color-fg-muted)">
          Thoughts on design engineering, motion, and interface craft.
        </p>
      </header>

      {all.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
      ) : (
        <Suspense fallback={null}>
          <PostsByYear posts={all} />
        </Suspense>
      )}
    </Container>
  )
}
