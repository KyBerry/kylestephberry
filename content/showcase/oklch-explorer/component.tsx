'use client'

import { useRef, useState } from 'react'

/**
 * An OKLCH ramp explorer: pick chroma and hue, get a lightness ramp with
 * live WCAG contrast ratios (computed by converting OKLCH to sRGB by hand)
 * and copy-ready oklch() values. Out-of-gamut steps are flagged, not hidden.
 */

const LIGHTNESS_STEPS = [0.25, 0.33, 0.41, 0.49, 0.57, 0.65, 0.73, 0.81, 0.89, 0.96]

interface Rgb {
  r: number
  g: number
  b: number
  inGamut: boolean
}

/** OKLCH -> linear sRGB (Björn Ottosson's OKLab matrices). */
function oklchToLinearRgb(L: number, C: number, H: number): Rgb {
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  const eps = 0.0005
  const inGamut = [r, g, bl].every((c) => c >= -eps && c <= 1 + eps)
  const clamp = (c: number) => Math.min(1, Math.max(0, c))
  return { r: clamp(r), g: clamp(g), b: clamp(bl), inGamut }
}

function toGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function toCss({ r, g, b }: Rgb): string {
  const to255 = (c: number) => Math.round(toGamma(c) * 255)
  return `rgb(${to255(r)} ${to255(g)} ${to255(b)})`
}

/** WCAG relative luminance from linear sRGB. */
function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(y1: number, y2: number): number {
  const [hi, lo] = y1 > y2 ? [y1, y2] : [y2, y1]
  return (hi + 0.05) / (lo + 0.05)
}

function wcagTier(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA lg'
  return 'fail'
}

export default function OklchExplorer() {
  const [chroma, setChroma] = useState(0.12)
  const [hue, setHue] = useState(145)
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const copyTimer = useRef(0)

  const copy = (value: string, step: number) => {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedStep(step)
        window.clearTimeout(copyTimer.current)
        copyTimer.current = window.setTimeout(() => setCopiedStep(null), 1200)
      })
      .catch(() => {})
  }

  return (
    <div className="mx-auto w-lg max-w-full">
      <div className="grid grid-cols-2 gap-6">
        <label className="block">
          <span className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            Chroma <span className="text-(--color-fg-muted)">{chroma.toFixed(3)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.005}
            value={chroma}
            onChange={(e) => setChroma(Number(e.target.value))}
            className="mt-2 w-full accent-(--color-accent)"
          />
        </label>
        <label className="block">
          <span className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            Hue <span className="text-(--color-fg-muted)">{hue}°</span>
          </span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="mt-2 w-full accent-(--color-accent)"
          />
        </label>
      </div>

      <ul className="mt-6 overflow-hidden rounded-(--radius-card) border border-(--color-border)">
        {LIGHTNESS_STEPS.map((L) => {
          const rgb = oklchToLinearRgb(L, chroma, hue)
          const y = luminance(rgb)
          const vsWhite = contrastRatio(y, 1)
          const vsBlack = contrastRatio(y, 0)
          const textOnSwatch = vsWhite >= vsBlack ? '#fff' : '#000'
          const ratio = Math.max(vsWhite, vsBlack)
          const value = `oklch(${L.toFixed(2)} ${chroma.toFixed(3)} ${hue})`

          return (
            <li key={L}>
              <button
                type="button"
                onClick={() => copy(value, L)}
                style={{ background: toCss(rgb), color: textOnSwatch }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left font-mono text-xs"
              >
                <span>
                  {copiedStep === L ? 'Copied!' : value}
                  {!rgb.inGamut ? <span title="outside sRGB, clamped"> · clipped</span> : null}
                </span>
                <span>
                  {ratio.toFixed(2)}:1 · {wcagTier(ratio)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 font-mono text-[10px] text-(--color-fg-subtle)">
        click a step to copy · contrast is vs. its own text color · “clipped” = outside sRGB
      </p>
    </div>
  )
}
