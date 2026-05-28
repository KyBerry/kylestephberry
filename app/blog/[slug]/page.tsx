import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { allPosts } from 'content-collections'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { PostMeta } from '@/components/blog/PostMeta'
import { TableOfContents } from '@/components/blog/TableOfContents'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): { slug: string }[] {
  return allPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = allPosts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
    },
  }
}

const BODY_ID = 'post-body'

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = allPosts.find((p) => p.slug === slug)
  if (!post) notFound()

  const MDXContent = post.MDXContent
  const newerLink =
    post.newerSlug && post.newerTitle ? { slug: post.newerSlug, title: post.newerTitle } : null
  const olderLink =
    post.olderSlug && post.olderTitle ? { slug: post.olderSlug, title: post.olderTitle } : null

  return (
    <>
      <Container variant="grid" as="section" className="pt-16 pb-8 md:pt-24">
        <Link
          href="/blog"
          className="group mb-8 inline-flex items-center gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
        >
          <ArrowLeft
            weight="regular"
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Writing
        </Link>

        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 max-w-prose text-lg text-pretty text-(--color-fg-muted)">
          {post.summary}
        </p>
        <PostMeta
          publishedAt={post.publishedAt}
          readingTime={post.readingTime}
          tags={post.tags}
          className="mt-6"
        />
      </Container>

      {/* Body + TOC */}
      <div className="mx-auto grid w-full max-w-(--container-grid) grid-cols-1 gap-12 px-6 pb-16 md:px-8 xl:grid-cols-[minmax(0,720px)_220px]">
        <article id={BODY_ID} className="prose-portfolio max-w-prose min-w-0">
          <MDXContent />
        </article>
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <TableOfContents targetSelector={`#${BODY_ID}`} />
          </div>
        </aside>
      </div>

      {/* Prev / next strip */}
      {(newerLink || olderLink) && (
        <Container
          variant="grid"
          as="nav"
          aria-label="Post navigation"
          className="border-t border-(--color-border) py-10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            {olderLink ? (
              <Link
                href={`/blog/${olderLink.slug}`}
                className="group inline-flex max-w-[48%] flex-col gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
              >
                <span className="font-mono text-xs text-(--color-fg-subtle)">Older</span>
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft
                    weight="regular"
                    size={14}
                    className="transition-transform group-hover:-translate-x-0.5"
                  />
                  {olderLink.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {newerLink ? (
              <Link
                href={`/blog/${newerLink.slug}`}
                className="group inline-flex max-w-[48%] flex-col items-end gap-1 text-right text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
              >
                <span className="font-mono text-xs text-(--color-fg-subtle)">Newer</span>
                <span className="inline-flex items-center gap-1">
                  {newerLink.title}
                  <ArrowRight
                    weight="regular"
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ) : null}
          </div>
        </Container>
      )}
    </>
  )
}
