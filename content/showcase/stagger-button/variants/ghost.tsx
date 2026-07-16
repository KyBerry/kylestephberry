'use client'

import { useState } from 'react'

const label = 'Stagger'

export default function StaggerButtonGhost() {
  // Keyboard parity: focusing the button plays the same stagger as hover.
  const [lifted, setLifted] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}
      onFocus={() => setLifted(true)}
      onBlur={() => setLifted(false)}
      className="overflow-hidden rounded-md border border-(--color-border) px-5 py-2.5 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
    >
      <span className="inline-flex">
        {label.split('').map((ch, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{
              transform: lifted ? 'translateY(-2px)' : 'translateY(0)',
              transitionDelay: lifted ? `${i * 25}ms` : `${(label.length - i) * 15}ms`,
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    </button>
  )
}
