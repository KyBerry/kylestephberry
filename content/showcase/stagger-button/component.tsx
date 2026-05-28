'use client'

import { useState } from 'react'

const label = 'Stagger'

export default function StaggerButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="overflow-hidden rounded-md border border-(--color-border-strong) bg-(--color-accent-soft) px-5 py-2.5 text-sm text-(--color-fg)"
    >
      <span className="inline-flex">
        {label.split('').map((ch, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-200 ease-out"
            style={{
              transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
              transitionDelay: hovered ? `${i * 25}ms` : `${(label.length - i) * 15}ms`,
            }}
          >
            {ch}
          </span>
        ))}
      </span>
    </button>
  )
}
