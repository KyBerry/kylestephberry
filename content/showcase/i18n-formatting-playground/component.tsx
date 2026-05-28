'use client'

import { useMemo, useState } from 'react'

type Direction = 'ltr' | 'rtl'

interface LocaleOption {
  code: string
  label: string
  nativeLabel: string
  currency: string
  direction: Direction
}

const LOCALE_OPTIONS = [
  {
    code: 'en-US',
    label: 'English (US)',
    nativeLabel: 'English',
    currency: 'USD',
    direction: 'ltr',
  },
  {
    code: 'fr-FR',
    label: 'French (France)',
    nativeLabel: 'Français',
    currency: 'EUR',
    direction: 'ltr',
  },
  {
    code: 'ja-JP',
    label: 'Japanese (Japan)',
    nativeLabel: '日本語',
    currency: 'JPY',
    direction: 'ltr',
  },
  {
    code: 'ar-EG',
    label: 'Arabic (Egypt)',
    nativeLabel: 'العربية',
    currency: 'EGP',
    direction: 'rtl',
  },
] as const satisfies readonly LocaleOption[]

type LocaleKey = (typeof LOCALE_OPTIONS)[number]['code']
type PluralCategory = ReturnType<Intl.PluralRules['select']>
type PluralLabels = { other: string } & Partial<Record<PluralCategory, string>>

interface LocaleCopy {
  eyebrow: string
  title: string
  invoice: string
  due: string
  activeUsers: string
  reviewers: PluralLabels
  collaborators: readonly string[]
}

const COPY = {
  'en-US': {
    eyebrow: 'Locale preview',
    title: 'Quarterly rollout',
    invoice: 'Invoice total',
    due: 'Due',
    activeUsers: 'Active users',
    reviewers: { one: 'reviewer', other: 'reviewers' },
    collaborators: ['Design', 'Engineering', 'Research'],
  },
  'fr-FR': {
    eyebrow: 'Aperçu régional',
    title: 'Déploiement trimestriel',
    invoice: 'Total de la facture',
    due: 'Échéance',
    activeUsers: 'Utilisateurs actifs',
    reviewers: { one: 'relecteur', other: 'relecteurs' },
    collaborators: ['Design', 'Ingénierie', 'Recherche'],
  },
  'ja-JP': {
    eyebrow: 'ロケールプレビュー',
    title: '四半期ロールアウト',
    invoice: '請求合計',
    due: '期限',
    activeUsers: 'アクティブユーザー',
    reviewers: { other: 'レビュー担当者' },
    collaborators: ['デザイン', 'エンジニアリング', 'リサーチ'],
  },
  'ar-EG': {
    eyebrow: 'معاينة اللغة',
    title: 'إطلاق ربع سنوي',
    invoice: 'إجمالي الفاتورة',
    due: 'تاريخ الاستحقاق',
    activeUsers: 'المستخدمون النشطون',
    reviewers: {
      zero: 'مراجع',
      one: 'مراجع',
      two: 'مراجعان',
      few: 'مراجعين',
      many: 'مراجعًا',
      other: 'مراجع',
    },
    collaborators: ['التصميم', 'الهندسة', 'البحث'],
  },
} as const satisfies Record<LocaleKey, LocaleCopy>

const SAMPLE_AMOUNT = 128430.75
const SAMPLE_USERS = 1289400
const SAMPLE_DATE = new Date('2026-05-28T16:30:00Z')
const RELATIVE_DAYS = 3

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg) p-4">
      <p className="truncate text-xs text-(--color-fg-muted)">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-(--color-fg) tabular-nums">{value}</p>
    </div>
  )
}

function DetailRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <dt className="text-(--color-fg-muted)">{term}</dt>
      <dd className="max-w-sm text-(--color-fg)">{children}</dd>
    </div>
  )
}

function formatPreview(locale: LocaleOption, reviewerCount: number) {
  const numberLocale = locale.code
  const currency = new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency: locale.currency,
    maximumFractionDigits: locale.currency === 'JPY' ? 0 : 2,
  })
  const date = new Intl.DateTimeFormat(numberLocale, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
  const compact = new Intl.NumberFormat(numberLocale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const relative = new Intl.RelativeTimeFormat(numberLocale, {
    numeric: 'auto',
    style: 'long',
  })
  const pluralRules = new Intl.PluralRules(numberLocale)
  const list = new Intl.ListFormat(numberLocale, {
    style: 'long',
    type: 'conjunction',
  })

  const category = pluralRules.select(reviewerCount)
  const copy: LocaleCopy = COPY[locale.code as LocaleKey]
  const reviewerLabel = copy.reviewers[category] ?? copy.reviewers.other

  return {
    amount: currency.format(SAMPLE_AMOUNT),
    date: date.format(SAMPLE_DATE),
    compactUsers: compact.format(SAMPLE_USERS),
    relativeDue: relative.format(RELATIVE_DAYS, 'day'),
    reviewerLabel,
    collaboratorList: list.format(copy.collaborators),
    copy,
    pluralCategory: category,
  }
}

export default function I18nFormattingPlayground() {
  const [localeCode, setLocaleCode] = useState<LocaleKey>('en-US')
  const [reviewerCount, setReviewerCount] = useState(2)
  const locale = LOCALE_OPTIONS.find((option) => option.code === localeCode) ?? LOCALE_OPTIONS[0]
  const preview = useMemo(() => formatPreview(locale, reviewerCount), [locale, reviewerCount])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 text-sm">
      {/* Controls: locale select + reviewer stepper, one compact row */}
      <div className="flex items-end gap-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="locale-select"
            className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase"
          >
            Locale
          </label>
          <select
            id="locale-select"
            value={localeCode}
            onChange={(event) => setLocaleCode(event.target.value as LocaleKey)}
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-fg) outline-none focus:border-(--color-accent)"
          >
            {LOCALE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.nativeLabel} · {option.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
            Reviewers
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setReviewerCount((count) => Math.max(0, count - 1))}
              className="size-8 rounded-md border border-(--color-border) text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
              aria-label="Decrease reviewer count"
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-(--color-fg) tabular-nums">
              {reviewerCount}
            </span>
            <button
              type="button"
              onClick={() => setReviewerCount((count) => Math.min(12, count + 1))}
              className="size-8 rounded-md border border-(--color-border) text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
              aria-label="Increase reviewer count"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Live formatted preview: re-renders in the selected locale + direction */}
      <div
        dir={locale.direction}
        aria-live="polite"
        className="rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
              {preview.copy.eyebrow}
            </p>
            <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] text-(--color-fg)">
              {preview.copy.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-(--color-border) px-3 py-1 font-mono text-[10px] text-(--color-fg-subtle)">
            {locale.label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label={preview.copy.invoice} value={preview.amount} />
          <Stat label={preview.copy.activeUsers} value={preview.compactUsers} />
        </div>

        <dl className="mt-3 grid gap-2.5 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg) p-4">
          <DetailRow term={preview.copy.due}>{preview.date}</DetailRow>
          <DetailRow term="Relative">{preview.relativeDue}</DetailRow>
          <DetailRow term="Plural">
            {reviewerCount} {preview.reviewerLabel}
          </DetailRow>
          <DetailRow term="List">{preview.collaboratorList}</DetailRow>
        </dl>

        <p className="mt-4 font-mono text-[10px] text-(--color-fg-subtle)">
          {locale.direction.toUpperCase()} · plural{' '}
          <span className="text-(--color-accent)">{preview.pluralCategory}</span>
        </p>
      </div>
    </div>
  )
}
