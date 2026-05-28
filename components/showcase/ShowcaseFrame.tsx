'use client'

import { useEffect, useState } from 'react'
import type { Showcase } from 'content-collections'
import { cn } from '@/lib/utils/cn'
import { FullscreenStage } from './FullscreenStage'
import { ScaledStage } from './ScaledStage'
import { SourcePane } from './SourcePane'
import { VariantChips } from './VariantChips'

// Frame consumes everything in a Showcase EXCEPT the server-only NotesMDX.
// Excluding it here keeps the boundary clean — React can serialize client
// component module refs (Component, variantComponents) but not server-only
// function refs.
type FrameEntry = Omit<Showcase, 'NotesMDX'>

interface ShowcaseFrameProps {
  entry: FrameEntry
  className?: string
}

const DEFAULT_KEY = 'default'

export function ShowcaseFrame({ entry, className }: ShowcaseFrameProps) {
  const variantNames = Object.keys(entry.variantSources)
  const allChips = [DEFAULT_KEY, ...variantNames]
  const hasVariants = variantNames.length > 0

  const [active, setActive] = useState(DEFAULT_KEY)
  // Initialise from localStorage lazily — avoids the cascading setState-in-effect
  // pattern that triggers react-hooks/set-state-in-effect.
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(`showcase-source-expanded:${entry.slug}`)
    return stored === null ? true : stored === '1'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`showcase-source-expanded:${entry.slug}`, expanded ? '1' : '0')
  }, [entry.slug, expanded])

  const ActiveComponent =
    active === DEFAULT_KEY ? entry.Component : entry.variantComponents[active]!
  const activeSourceText =
    active === DEFAULT_KEY ? entry.sourceText : entry.variantSources[active]!.sourceText
  const activeSourceHast =
    active === DEFAULT_KEY ? entry.sourceHast : entry.variantSources[active]!.sourceHast
  const activeFilename = active === DEFAULT_KEY ? 'component.tsx' : `variants/${active}.tsx`

  return (
    <div
      className={cn(
        'overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface)',
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) px-4 py-3">
        <h3 className="text-sm font-medium text-(--color-fg)">{entry.title}</h3>
        <div className="flex items-center gap-3">
          {hasVariants ? (
            <VariantChips variants={allChips} active={active} onChange={setActive} />
          ) : null}
          <FullscreenStage title={entry.title}>
            <ActiveComponent />
          </FullscreenStage>
        </div>
      </div>

      {/* Body: preview on top, code below — always stacked */}
      <div className="flex flex-col divide-y divide-(--color-border)">
        {/*
          Scale-to-fit so the whole component fits the preview box. Interactive
          (unlike the index card): this is the detail page, so the live preview
          should respond to clicks/hover. The fullscreen escape hatch above still
          shows it at true 1:1 with scroll.
        */}
        <div className="aspect-[16/10] bg-(--color-bg)">
          <ScaledStage interactive>
            <ActiveComponent />
          </ScaledStage>
        </div>
        <div className={expanded ? 'h-[480px]' : ''}>
          <SourcePane
            filename={activeFilename}
            sourceText={activeSourceText}
            sourceHast={activeSourceHast}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
