import type { ReactNode } from 'react'
import { Info, Warning, Lightbulb } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils/cn'

type CalloutType = 'note' | 'warn' | 'tip'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

const config: Record<CalloutType, { Icon: typeof Info; tone: string }> = {
  note: { Icon: Info, tone: 'border-(--color-border-strong) bg-(--color-surface)' },
  warn: { Icon: Warning, tone: 'border-amber-500/40 bg-amber-500/5' },
  tip: { Icon: Lightbulb, tone: 'border-(--color-accent) bg-(--color-accent-soft)' },
}

export function Callout({ type = 'note', title, children }: CalloutProps) {
  const { Icon, tone } = config[type]
  return (
    <aside
      className={cn(
        'my-6 flex gap-3 rounded-(--radius-card) border px-4 py-3 text-sm text-(--color-fg)',
        tone,
      )}
    >
      <Icon weight="regular" size={16} className="mt-1 shrink-0 text-(--color-fg-muted)" />
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-1 font-medium">{title}</p> : null}
        <div className="text-(--color-fg-muted) [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </aside>
  )
}
