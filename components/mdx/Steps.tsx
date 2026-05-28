import { Children, isValidElement, type ReactNode } from 'react'

interface StepsProps {
  children: ReactNode
}

export function Steps({ children }: StepsProps) {
  const items = Children.toArray(children).filter(isValidElement)
  return (
    <ol className="my-6 space-y-6 border-l border-(--color-border) pl-6">
      {items.map((child, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden
            className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) font-mono text-[10px] text-(--color-fg-muted)"
          >
            {i + 1}
          </span>
          <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{child}</div>
        </li>
      ))}
    </ol>
  )
}
