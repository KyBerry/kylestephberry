'use client'

import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

interface DataPoint {
  date: string
  shortDate: string
  value: number
}

const DATA = [
  { date: 'May 5, 2026', shortDate: 'May 5', value: 54 },
  { date: 'May 12, 2026', shortDate: 'May 12', value: 56 },
  { date: 'May 19, 2026', shortDate: 'May 19', value: 55 },
  { date: 'May 26, 2026', shortDate: 'May 26', value: 58 },
  { date: 'June 2, 2026', shortDate: 'Jun 2', value: 61 },
  { date: 'June 9, 2026', shortDate: 'Jun 9', value: 60 },
  { date: 'June 16, 2026', shortDate: 'Jun 16', value: 63 },
  { date: 'June 23, 2026', shortDate: 'Jun 23', value: 65 },
  { date: 'June 30, 2026', shortDate: 'Jun 30', value: 64 },
  { date: 'July 7, 2026', shortDate: 'Jul 7', value: 66 },
  { date: 'July 14, 2026', shortDate: 'Jul 14', value: 67 },
  { date: 'July 21, 2026', shortDate: 'Jul 21', value: 68 },
] as const satisfies readonly DataPoint[]

const CHART_WIDTH = 640
const CHART_HEIGHT = 240
const PLOT_LEFT = 44
const PLOT_RIGHT = 18
const PLOT_TOP = 24
const PLOT_BOTTOM = 34
const VALUE_MIN = 50
const VALUE_MAX = 70
const Y_TICKS = [50, 60, 70] as const

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function pointAt(index: number): DataPoint {
  return DATA[index] ?? DATA[0]
}

function xFor(index: number): number {
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT
  return PLOT_LEFT + (index / (DATA.length - 1)) * plotWidth
}

function yFor(value: number): number {
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM
  return PLOT_TOP + ((VALUE_MAX - value) / (VALUE_MAX - VALUE_MIN)) * plotHeight
}

function changeLabel(index: number): string {
  if (index === 0) return 'Baseline'
  const change = pointAt(index).value - pointAt(index - 1).value
  if (change === 0) return 'No change'
  return `${change > 0 ? '+' : '−'}${Math.abs(change)} pp`
}

function accessibleChangeLabel(index: number): string {
  if (index === 0) return 'Baseline'
  const change = pointAt(index).value - pointAt(index - 1).value
  if (change === 0) return 'No change'
  return `${change > 0 ? 'Up' : 'Down'} ${Math.abs(change)} ${
    Math.abs(change) === 1 ? 'percentage point' : 'percentage points'
  }`
}

function tooltipTransform(index: number): string {
  if (index < 2) return 'translate(0, 12px)'
  if (index > DATA.length - 3) return 'translate(-100%, 12px)'
  return 'translate(-50%, 12px)'
}

export default function AccessibleTimeSeries() {
  const [selectedIndex, setSelectedIndex] = useState(DATA.length - 1)
  const [showTable, setShowTable] = useState(false)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const instructionsId = useId()
  const summaryId = useId()
  const tableId = useId()

  const selected = pointAt(selectedIndex)
  const selectedX = xFor(selectedIndex)
  const selectedY = yFor(selected.value)
  const linePoints = DATA.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(' ')
  const areaPoints = `${PLOT_LEFT},${CHART_HEIGHT - PLOT_BOTTOM} ${linePoints} ${xFor(
    DATA.length - 1,
  )},${CHART_HEIGHT - PLOT_BOTTOM}`

  function selectFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const viewBoxX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH
    const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT
    const rawIndex = Math.round(((viewBoxX - PLOT_LEFT) / plotWidth) * (DATA.length - 1))
    setSelectedIndex(clamp(rawIndex, 0, DATA.length - 1))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let nextIndex = selectedIndex

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextIndex = selectedIndex - 1
        break
      case 'ArrowRight':
      case 'ArrowUp':
        nextIndex = selectedIndex + 1
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = DATA.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    setSelectedIndex(clamp(nextIndex, 0, DATA.length - 1))
  }

  return (
    <section className="mx-auto w-[640px] max-w-full overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface)">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--color-border) px-5 py-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-(--color-fg-subtle) uppercase">
            Sample activation rate
          </p>
          <p id={summaryId} className="mt-1.5 max-w-sm text-sm text-(--color-fg-muted)">
            This sample rises from 54% to 68% across 12 weeks, with three one-point dips.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-(--color-fg) tabular-nums">{selected.value}%</p>
          <p className="font-mono text-[10px] text-(--color-fg-subtle)">{selected.shortDate}</p>
        </div>
      </div>

      <div className="px-3 pt-4 sm:px-5">
        <div
          ref={chartRef}
          role="slider"
          tabIndex={0}
          aria-label="Inspect sample activation data by week"
          aria-valuemin={1}
          aria-valuemax={DATA.length}
          aria-valuenow={selectedIndex + 1}
          aria-valuetext={
            selectedIndex === 0
              ? `${selected.date}: ${selected.value}% activation, baseline week`
              : `${selected.date}: ${selected.value}% activation, ${accessibleChangeLabel(
                  selectedIndex,
                )} from the prior week`
          }
          aria-describedby={`${summaryId} ${instructionsId}`}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            chartRef.current?.focus()
            selectFromPointer(event)
          }}
          onPointerMove={selectFromPointer}
          className="relative aspect-[640/240] w-full touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            aria-hidden="true"
            focusable="false"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {Y_TICKS.map((tick) => {
              const y = yFor(tick)
              return (
                <g key={tick}>
                  <line
                    x1={PLOT_LEFT}
                    x2={CHART_WIDTH - PLOT_RIGHT}
                    y1={y}
                    y2={y}
                    stroke="var(--color-border)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={PLOT_LEFT - 10}
                    y={y + 4}
                    fill="var(--color-fg-subtle)"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {tick}%
                  </text>
                </g>
              )
            })}

            <polygon points={areaPoints} fill="var(--color-accent-soft)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            <circle
              cx={selectedX}
              cy={selectedY}
              r="4"
              fill="var(--color-bg)"
              stroke="var(--color-accent)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            <line
              x1={selectedX}
              x2={selectedX}
              y1={selectedY + 7}
              y2={CHART_HEIGHT - PLOT_BOTTOM}
              stroke="var(--color-border-strong)"
              strokeWidth="1"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />

            {[0, Math.floor((DATA.length - 1) / 2), DATA.length - 1].map((index) => (
              <text
                key={DATA[index]?.date}
                x={xFor(index)}
                y={CHART_HEIGHT - 9}
                fill="var(--color-fg-subtle)"
                fontSize="10"
                textAnchor={index === 0 ? 'start' : index === DATA.length - 1 ? 'end' : 'middle'}
              >
                {pointAt(index).shortDate}
              </text>
            ))}
          </svg>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 min-w-24 rounded-md border border-(--color-border-strong) bg-(--color-bg) px-2.5 py-2 text-xs shadow-lg"
            style={{
              left: `${(selectedX / CHART_WIDTH) * 100}%`,
              top: `${(selectedY / CHART_HEIGHT) * 100}%`,
              transform: tooltipTransform(selectedIndex),
            }}
          >
            <p className="text-(--color-fg)">{selected.value}% activation</p>
            <p className="mt-0.5 flex items-center justify-between gap-2 font-mono text-[9px] text-(--color-fg-subtle)">
              <span>{selected.shortDate}</span>
              <span>{changeLabel(selectedIndex)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) py-3">
          <p
            id={instructionsId}
            className="flex flex-wrap gap-x-3 font-mono text-[10px] text-(--color-fg-subtle)"
          >
            <span>Pointer or arrow keys</span>
            <span>Home / End</span>
          </p>
          <button
            type="button"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable((current) => !current)}
            className="rounded-md border border-(--color-border) px-2.5 py-1.5 text-xs text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg)"
          >
            {showTable ? 'Hide data' : 'View data'}
          </button>
        </div>
      </div>

      {showTable ? (
        <div
          id={tableId}
          className="max-h-52 scrollbar-thin overflow-auto border-t border-(--color-border)"
        >
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">Sample activation data by week</caption>
            <thead className="sticky top-0 bg-(--color-surface)">
              <tr className="font-mono text-[10px] tracking-[0.12em] text-(--color-fg-subtle) uppercase">
                <th scope="col" className="px-5 py-2.5 font-normal">
                  Week
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-normal">
                  Activation
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-normal">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {DATA.map((point, index) => (
                <tr key={point.date}>
                  <th scope="row" className="px-5 py-2 font-normal text-(--color-fg-muted)">
                    {point.date}
                  </th>
                  <td className="px-5 py-2 text-right text-(--color-fg) tabular-nums">
                    {point.value}%
                  </td>
                  <td className="px-5 py-2 text-right font-mono text-(--color-fg-subtle)">
                    {changeLabel(index)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
