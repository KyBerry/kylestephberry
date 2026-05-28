import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import type { Work } from 'content-collections'

interface WorkTimelineProps {
  entries: Work['entries']
}

export function WorkTimeline({ entries }: WorkTimelineProps) {
  return (
    <ol className="divide-y divide-(--color-border)">
      {entries.map((entry, i) => (
        <li
          key={`${entry.years}-${entry.company}-${i}`}
          className="grid grid-cols-[120px_1fr] items-baseline gap-x-8 gap-y-2 py-5 md:grid-cols-[160px_1fr]"
        >
          <span className="font-mono text-xs text-(--color-fg-subtle)">{entry.years}</span>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-2 text-(--color-fg)">
              <span className="font-medium">{entry.role}</span>
              <span className="text-(--color-fg-subtle)">·</span>
              {entry.companyUrl ? (
                <a
                  href={entry.companyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 text-(--color-fg-muted) transition-colors hover:text-(--color-accent)"
                >
                  {entry.company}
                  <ArrowUpRight
                    weight="regular"
                    size={11}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </a>
              ) : (
                <span className="text-(--color-fg-muted)">{entry.company}</span>
              )}
              {entry.contract ? (
                <span className="rounded-md border border-(--color-border) px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-(--color-fg-subtle)">
                  Contract
                </span>
              ) : null}
            </div>
            <p className="text-sm text-(--color-fg-muted)">{entry.context}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
