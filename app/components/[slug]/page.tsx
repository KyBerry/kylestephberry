import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { allShowcases } from 'content-collections'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { ShowcaseCard } from '@/components/showcase/ShowcaseCard'
import { ShowcaseFrame } from '@/components/showcase/ShowcaseFrame'
import { related, withoutNotes } from '@/lib/content/helpers'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): { slug: string }[] {
  return allShowcases.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = allShowcases.find((e) => e.slug === slug)
  if (!entry) return {}
  return {
    title: entry.title,
    description: entry.summary,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ShowcaseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const entry = allShowcases.find((e) => e.slug === slug)
  if (!entry) notFound()

  const Notes = entry.NotesMDX
  const frameEntry = withoutNotes(entry)
  const relatedEntries = related(allShowcases, entry, 3)

  return (
    <>
      <Container variant="grid" as="section" className="pt-16 pb-8 md:pt-24">
        <Link
          href="/components"
          className="group mb-8 inline-flex items-center gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
        >
          <ArrowLeft
            weight="regular"
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          All components
        </Link>

        <p className="mb-3 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          Component · {formatDate(entry.publishedAt)}
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-4 max-w-prose text-lg text-pretty text-(--color-fg-muted)">
          {entry.summary}
        </p>
        {entry.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="rounded border border-(--color-border) px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-(--color-fg-muted) uppercase"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>

      <Container variant="grid" as="section" className="pb-16">
        <ShowcaseFrame entry={frameEntry} />
      </Container>

      <Container variant="prose" as="article" className="pb-16">
        <div className="prose-portfolio">
          <Notes />
        </div>
      </Container>

      {relatedEntries.length > 0 ? (
        <Container
          variant="grid"
          as="section"
          className="border-t border-(--color-border) pt-16 pb-24"
        >
          <h2 className="mb-8 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
            Related
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedEntries.map((e) => (
              <ShowcaseCard key={e.slug} entry={withoutNotes(e)} />
            ))}
          </div>
        </Container>
      ) : null}
    </>
  )
}
