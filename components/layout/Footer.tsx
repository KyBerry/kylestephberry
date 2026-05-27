import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { site } from '@/lib/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-(--color-border) py-10 text-sm">
      <Container
        variant="grid"
        as="div"
        className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <a
            href={`mailto:${site.email}`}
            className="font-mono text-(--color-fg) transition-colors hover:text-(--color-accent)"
          >
            {site.email}
          </a>
          <span className="text-xs text-(--color-fg-subtle)">
            © {year} {site.name}
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {site.socials.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
            >
              {s.label}
              <ArrowUpRight
                weight="regular"
                size={12}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  )
}
