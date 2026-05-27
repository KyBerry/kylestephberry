'use client'

import { useState } from 'react'

export default function HelloButton() {
  const [count, setCount] = useState(0)
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setCount((n) => n + 1)}
        className="rounded-md border border-(--color-border-strong) bg-(--color-surface) px-4 py-2 text-sm text-(--color-fg) transition-colors hover:bg-(--color-surface-hover)"
      >
        Hello
      </button>
      <span className="font-mono text-xs text-(--color-fg-subtle)">clicked {count}×</span>
    </div>
  )
}
