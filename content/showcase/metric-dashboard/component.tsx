'use client'

import { useEffect, useRef, useState } from 'react'

const COUNT_MS = 1100
const DRAW_MS = 900

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/** Animated count-up; returns a formatted string (locale-grouped or fixed-decimal). */
function useCountUp(target: number, active: boolean, decimals = 0): string {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_MS, 1)
      setValue(easeOutQuart(progress) * target)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, active])

  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()
}

function sparkPath(data: number[], w: number, h: number): string {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const innerH = h - pad * 2
  const step = (w - pad * 2) / (data.length - 1)
  return data
    .map((v, i) => {
      const x = pad + i * step
      const y = pad + innerH - ((v - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function Sparkline({
  data,
  active,
  className,
}: {
  data: number[]
  active: boolean
  className?: string
}) {
  const W = 400
  const H = 48
  const pathRef = useRef<SVGPathElement | null>(null)
  const [len, setLen] = useState(0)
  const [drawn, setDrawn] = useState(false)
  const d = sparkPath(data, W, H)

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength())
  }, [d])

  useEffect(() => {
    if (!active || !len) return
    const timer = setTimeout(() => setDrawn(true), 150)
    return () => clearTimeout(timer)
  }, [active, len])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        ref={pathRef}
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{
          strokeDasharray: len || undefined,
          strokeDashoffset: drawn ? 0 : len,
          transition: drawn ? `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none',
        }}
      />
    </svg>
  )
}

const HERO = {
  label: 'Weekly visitors',
  value: 4820,
  delta: '+14%',
  data: [310, 340, 290, 380, 420, 400, 450, 480, 460, 510],
}

interface SupportingMetric {
  label: string
  value: number
  decimals: number
  suffix: string
  delta: string
}

const SUPPORTING: SupportingMetric[] = [
  { label: 'Avg. session', value: 3.4, decimals: 1, suffix: 'm', delta: '+6%' },
  { label: 'Bounce rate', value: 38, decimals: 0, suffix: '%', delta: '−4%' },
  { label: 'Pages / visit', value: 4.2, decimals: 1, suffix: '', delta: '+9%' },
]

function Supporting({ metric, active }: { metric: SupportingMetric; active: boolean }) {
  const value = useCountUp(metric.value, active, metric.decimals)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-(--color-fg-subtle)">{metric.label}</span>
      <span className="text-lg font-medium text-(--color-fg) tabular-nums">
        {value}
        {metric.suffix}
      </span>
      <span className="text-[11px] text-(--color-fg-subtle) tabular-nums">{metric.delta}</span>
    </div>
  )
}

export default function MetricDashboard() {
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const heroValue = useCountUp(HERO.value, active)

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
      className="mx-auto w-full max-w-md rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-6"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          Last 7 days
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-(--color-fg-subtle)">
          <span className="size-1.5 rounded-full bg-(--color-accent)" aria-hidden="true" />
          Live
        </span>
      </div>

      {/* Hero metric, the focal point: large value + the one sage sparkline */}
      <div className="mt-7">
        <p className="text-sm text-(--color-fg-muted)">{HERO.label}</p>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <span className="text-4xl font-semibold text-(--color-fg) tabular-nums">{heroValue}</span>
          <span className="text-sm text-(--color-fg-subtle) tabular-nums">{HERO.delta}</span>
        </div>
        <Sparkline data={HERO.data} active={active} className="mt-5 h-12 w-full text-(--color-accent)" />
      </div>

      {/* Supporting metrics: restrained, monochrome, no sparklines competing with the hero */}
      <div className="mt-7 grid grid-cols-3 gap-4 border-t border-(--color-border) pt-6">
        {SUPPORTING.map((metric) => (
          <Supporting key={metric.label} metric={metric} active={active} />
        ))}
      </div>
    </div>
  )
}
