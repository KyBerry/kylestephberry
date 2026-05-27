import type { Metadata } from 'next'
import { allPosts } from 'content-collections'
import { Container } from '@/components/ui/Container'
import { PostCard } from '@/components/blog/PostCard'
import { latest } from '@/lib/content/helpers'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Notes on design engineering, motion, and interface craft.',
}

export default function BlogIndexPage() {
  const all = latest(allPosts, allPosts.length)

  return (
    <Container variant="prose" as="section" className="py-24 md:py-32">
      <header className="mb-12 md:mb-16">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          Writing
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          Notes
        </h1>
        <p className="mt-4 text-(--color-fg-muted)">
          Thoughts on design engineering, motion, and interface craft.
        </p>
      </header>

      {all.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {all.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
