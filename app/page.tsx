import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { site } from '@/lib/site'

export default function HomePage() {
  return (
    <Container variant="hero" as="section" className="pt-24 pb-32 md:pt-32 md:pb-40">
      <p className="mb-6 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
        {site.role}
      </p>

      <h1 className="text-5xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-6xl">
        {site.name}
      </h1>

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
