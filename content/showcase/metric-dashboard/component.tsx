'use client'

import { useState, useEffect, useRef } from 'react'

interface Metric {
  label: string
  value: number
  unit: string
  trend: string
  positive: boolean
  data: number[]
  ariaLabel: string
}

const METRICS: Metric[] = [
  {
    label: 'Weekly visitors',
    value: 4820,
    unit: 'this week',
    trend: '+14%',
    positive: true,
    data: [310, 340, 290, 380, 420, 400, 450, 480, 460, 510],
    ariaLabel: 'Weekly visitors sparkline trending upward over 10 periods',
  },
  {
    label: 'Avg. session',
    value: 3.4,
    unit: 'min avg',
    trend: '+6%',
    positive: true,
    data: [2.1, 2.4, 2.2, 2.6, 2.8, 2.7, 3.0, 3.2, 3.1, 3.4],
    ariaLabel: 'Average session length sparkline trending upward over 10 periods',
  },
  {
    label: 'Bounce rate',
    value: 38,
    unit: '%',
    trend: '-4%',
    positive: true,
    data: [55, 52, 53, 50, 48, 46, 44, 42, 40, 38],
    ariaLabel: 'Bounce rate sparkline trending downward over 10 periods',
  },
  {
    label: 'Pages / session',
    value: 4.2,
    unit: 'avg',
    trend: '+9%',
    positive: true,
    data: [2.8, 3.0, 2.9, 3.2, 3.4, 3.6, 3.8, 4.0, 3.9, 4.2],
    ariaLabel: 'Pages per session sparkline trending upward over 10 periods',
  },
]

const SPARKLINE_W = 80
const SPARKLINE_H = 28
const DURATION_COUNT = 1200
const DURATION_PATH = 900
const EASING_DELAY = 120

function buildPath(data: number[]): string {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const innerH = SPARKLINE_H - pad * 2
  const step = (SPARKLINE_W - pad * 2) / (data.length - 1)

  return data
    .map((v, i) => {
      const x = pad + i * step
      const y = pad + innerH - ((v - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION_COUNT, 1)
      setCount(Math.round(easeOutQuart(progress) * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, active])

  return count
}

function SparklineCard({ metric, index, active }: { metric: Metric; index: number; active: boolean }) {
  const count = useCountUp(metric.value, active)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [pathLen, setPathLen] = useState(0)
  const [drawn, setDrawn] = useState(false)

  const d = buildPath(metric.data)

  useEffect(() => {
    if (pathRef.current) {
      setPathLen(pathRef.current.getTotalLength())
    }
  }, [d])

  useEffect(() => {
    if (!active || pathLen === 0) return
    const timer = setTimeout(() => setDrawn(true), index * EASING_DELAY)
    return () => clearTimeout(timer)
  }, [active, pathLen, index])

  const trendColor = metric.positive
    ? 'text-(--color-accent)'
    : 'text-(--color-fg-subtle)'
  const trendGlyph = metric.positive ? '▲' : '▼'

  return (
    <div className="flex flex-col gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-(--color-fg-muted) uppercase tracking-wide leading-none">
          {metric.label}
        </span>
        <span className={`flex items-center gap-1 text-xs font-semibold tabular-nums ${trendColor}`}>
          <span aria-hidden="true">{trendGlyph}</span>
          {metric.trend}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="text-2xl font-semibold tabular-nums text-(--color-fg) leading-none">
            {count.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-(--color-fg-subtle)">
            {metric.unit}
          </span>
        </div>

        <svg
          width={SPARKLINE_W}
          height={SPARKLINE_H}
          viewBox={`0 0 ${SPARKLINE_W} ${SPARKLINE_H}`}
          fill="none"
          aria-label={metric.ariaLabel}
          role="img"
          className="shrink-0 text-(--color-accent)"
        >
          <path
            ref={pathRef}
            d={d}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLen || undefined,
              strokeDashoffset: drawn ? 0 : pathLen,
              transition: drawn
                ? `stroke-dashoffset ${DURATION_PATH}ms cubic-bezier(0.16, 1, 0.3, 1)`
                : 'none',
            }}
          />
        </svg>
      </div>
    </div>
  )
}

export default function MetricDashboard() {
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 gap-4"
    >
      {METRICS.map((metric, i) => (
        <SparklineCard key={metric.label} metric={metric} index={i} active={active} />
      ))}
    </div>
  )
}
