import { allShowcases } from 'content-collections'
import { ShowcaseFrame } from '@/components/showcase/ShowcaseFrame'
import { withoutNotes } from '@/lib/content/helpers'

interface ShowcaseEmbedProps {
  slug: string
}

export function ShowcaseEmbed({ slug }: ShowcaseEmbedProps) {
  const entry = allShowcases.find((e) => e.slug === slug)
  if (!entry) {
    return (
      <div className="my-6 rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-4 font-mono text-xs text-(--color-fg-subtle)">
        Missing showcase: {slug}
      </div>
    )
  }
  return (
    <div className="my-6">
      <ShowcaseFrame entry={withoutNotes(entry)} />
    </div>
  )
}
