'use client'

import { useState } from 'react'

type Tab = 'color' | 'typography' | 'space'

const TABS: Tab[] = ['color', 'typography', 'space']

const COLOR_TOKENS = [
  { name: '--color-bg', label: 'bg' },
  { name: '--color-surface', label: 'surface' },
  { name: '--color-surface-hover', label: 'surface-hover' },
  { name: '--color-border', label: 'border' },
  { name: '--color-border-strong', label: 'border-strong' },
  { name: '--color-fg', label: 'fg' },
  { name: '--color-fg-muted', label: 'fg-muted' },
  { name: '--color-fg-subtle', label: 'fg-subtle' },
  { name: '--color-accent', label: 'accent' },
  { name: '--color-accent-soft', label: 'accent-soft' },
]

const TYPE_TOKENS = [
  { name: 'xs', rem: '0.75rem', px: '12px', cls: 'text-xs' },
  { name: 'sm', rem: '0.875rem', px: '14px', cls: 'text-sm' },
  { name: 'base', rem: '1rem', px: '16px', cls: 'text-base' },
  { name: 'lg', rem: '1.125rem', px: '18px', cls: 'text-lg' },
  { name: 'xl', rem: '1.25rem', px: '20px', cls: 'text-xl' },
  { name: '2xl', rem: '1.5rem', px: '24px', cls: 'text-2xl' },
  { name: '3xl', rem: '1.875rem', px: '30px', cls: 'text-3xl' },
]

const SPACE_TOKENS = [
  { name: '1', px: 4 },
  { name: '2', px: 8 },
  { name: '4', px: 16 },
  { name: '6', px: 24 },
  { name: '8', px: 32 },
  { name: '12', px: 48 },
  { name: '16', px: 64 },
  { name: '24', px: 96 },
]

const MAX_SPACE_PX = 96

function ColorTab({ copied, onCopy }: { copied: string | null; onCopy: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {COLOR_TOKENS.map(({ name, label }) => {
        const isCopied = copied === name
        return (
          <button
            key={name}
            type="button"
            onClick={() => onCopy(name)}
            className="group flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-left transition-colors"
          >
            <span
              className="h-7 w-7 flex-shrink-0 rounded-md border border-(--color-border)"
              style={{ background: `var(${name})` }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs text-(--color-fg)">
                {isCopied ? 'Copied' : label}
              </span>
              {!isCopied && (
                <span className="block truncate text-[10px] text-(--color-fg-subtle) opacity-0 transition-opacity group-hover:opacity-100">
                  {name}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function TypeTab() {
  return (
    <div className="divide-y divide-(--color-border) overflow-hidden rounded-md border border-(--color-border)">
      {TYPE_TOKENS.map(({ name, rem, px, cls }) => (
        <div key={name} className="flex items-center gap-4 bg-(--color-surface) px-4 py-3">
          <span className={`${cls} w-16 flex-shrink-0 font-sans leading-none text-(--color-fg)`}>
            Aa
          </span>
          <span className="w-10 flex-shrink-0 text-xs text-(--color-fg-muted)">{name}</span>
          <span className="ml-auto text-right text-[10px] text-(--color-fg-subtle) tabular-nums">
            {rem} / {px}
          </span>
        </div>
      ))}
    </div>
  )
}

function SpaceTab() {
  return (
    <div className="flex flex-col gap-2.5">
      {SPACE_TOKENS.map(({ name, px }) => (
        <div key={name} className="flex items-center gap-3">
          <span className="w-5 flex-shrink-0 text-right text-xs text-(--color-fg-muted) tabular-nums">
            {name}
          </span>
          <div className="flex h-5 flex-1 items-center rounded-md bg-(--color-surface)">
            <div
              className="h-full rounded-md border border-(--color-accent) bg-(--color-accent-soft)"
              style={{ width: `${(px / MAX_SPACE_PX) * 100}%` }}
            />
          </div>
          <span className="w-10 flex-shrink-0 text-right text-[10px] text-(--color-fg-subtle) tabular-nums">
            {px}px
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TokenExplorer() {
  const [activeTab, setActiveTab] = useState<Tab>('color')
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(value)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div className="mx-auto w-full max-w-lg font-mono text-sm">
      <div className="mb-5 flex gap-0 border-b border-(--color-border)">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab ? 'text-(--color-fg)' : 'text-(--color-fg-muted)'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-[-1px] left-0 h-[2px] w-full rounded-full bg-(--color-accent)" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'color' && <ColorTab copied={copied} onCopy={copyToClipboard} />}
      {activeTab === 'typography' && <TypeTab />}
      {activeTab === 'space' && <SpaceTab />}
    </div>
  )
}
