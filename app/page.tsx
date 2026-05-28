import { allShowcases, allDesigns, allPosts, work } from 'content-collections'
import { Hero } from '@/components/home/Hero'
import { WorkTimeline } from '@/components/home/WorkTimeline'
import { Section } from '@/components/ui/Section'
import { ShowcaseCard } from '@/components/showcase/ShowcaseCard'
import { DesignTile } from '@/components/designs/DesignTile'
import { PostCard } from '@/components/blog/PostCard'
import { featured, latest, withoutNotes } from '@/lib/content/helpers'

export default function HomePage() {
  const featuredShowcases = featured(allShowcases, 6)
  const featuredDesigns = featured(allDesigns, 8)
  const latestPosts = latest(allPosts, 3)

  return (
    <>
      <Hero />

      <Section
        eyebrow="Work"
        heading="Where I've been"
        intro="Five years across fintech, wellness, and AI, from QA automation to leading frontend architecture and building production-scale product UIs."
      >
        <WorkTimeline entries={work.entries} />
      </Section>

      <Section
        eyebrow="Components"
        heading="Interactive components"
        intro="Interface patterns I build on my own time. Each one runs live, and the source is a click away."
        seeAllHref="/components"
      >
        {featuredShowcases.length === 0 ? (
          <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredShowcases.map((entry, i) => (
              <ShowcaseCard key={entry.slug} entry={withoutNotes(entry)} index={i} />
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Designs"
        heading="Selected design work"
        intro="Personal Figma work, from dashboard layouts to wellness apps and design systems."
        seeAllHref="/designs"
      >
        {featuredDesigns.length === 0 ? (
          <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDesigns.map((entry, i) => (
              <DesignTile key={entry.slug} entry={entry} priority={i < 4} index={i} />
            ))}
          </div>
        )}
      </Section>

      <Section
        eyebrow="Writing"
        heading="Recent notes"
        intro="Notes on motion, architecture, accessibility, and where design and engineering overlap."
        seeAllHref="/blog"
      >
        {latestPosts.length === 0 ? (
          <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {latestPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
