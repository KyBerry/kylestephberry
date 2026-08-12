'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'

type LocaleCode = 'en-US' | 'fr-FR' | 'ar-EG'

interface LocaleConfig {
  code: LocaleCode
  label: string
  direction: 'ltr' | 'rtl'
  weekStartsOn: number
}

interface DateRange {
  start: Date | null
  end: Date | null
}

interface Preset {
  label: string
  start: Date
  end: Date
}

const LOCALES = [
  { code: 'en-US', label: 'English', direction: 'ltr', weekStartsOn: 0 },
  { code: 'fr-FR', label: 'Français', direction: 'ltr', weekStartsOn: 1 },
  { code: 'ar-EG', label: 'العربية', direction: 'rtl', weekStartsOn: 6 },
] as const satisfies readonly LocaleConfig[]

const COPY = {
  'en-US': {
    eyebrow: 'Delivery window',
    title: 'Choose a date range',
    locale: 'Locale',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    presets: 'Presets',
    firstWeek: 'First week',
    launchWeek: 'Launch week',
    clear: 'Clear',
    start: 'Start',
    end: 'End',
    chooseStart: 'Choose a start date',
    chooseEnd: 'Choose an end date',
    to: 'to',
    days: 'days',
    unavailable: 'Unavailable',
    keyboard: ['Arrow keys move', 'Home/End move by week', 'Page Up/Down change month'],
    selected: 'Selected',
  },
  'fr-FR': {
    eyebrow: 'Fenêtre de livraison',
    title: 'Choisir une période',
    locale: 'Langue',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    presets: 'Raccourcis',
    firstWeek: 'Première semaine',
    launchWeek: 'Semaine de lancement',
    clear: 'Effacer',
    start: 'Début',
    end: 'Fin',
    chooseStart: 'Choisissez une date de début',
    chooseEnd: 'Choisissez une date de fin',
    to: 'au',
    days: 'jours',
    unavailable: 'Indisponible',
    keyboard: ['Flèches pour bouger', 'Début/Fin par semaine', 'Page préc./suiv. par mois'],
    selected: 'Sélectionné',
  },
  'ar-EG': {
    eyebrow: 'موعد التسليم',
    title: 'اختر نطاقًا زمنيًا',
    locale: 'اللغة',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    presets: 'خيارات سريعة',
    firstWeek: 'الأسبوع الأول',
    launchWeek: 'أسبوع الإطلاق',
    clear: 'مسح',
    start: 'البداية',
    end: 'النهاية',
    chooseStart: 'اختر تاريخ البداية',
    chooseEnd: 'اختر تاريخ النهاية',
    to: 'إلى',
    days: 'أيام',
    unavailable: 'غير متاح',
    keyboard: ['الأسهم للتنقل', 'Home/End للأسبوع', 'Page Up/Down للشهر'],
    selected: 'النطاق المختار',
  },
} as const

const INITIAL_MONTH = utcDate(2026, 7, 1)
const INITIAL_FOCUS_DATE = utcDate(2026, 7, 15)
const UNAVAILABLE_DATES = new Set(['2026-08-12', '2026-08-20', '2026-09-03'])

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day))
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), 1)
}

function addDays(date: Date, amount: number) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount)
}

function addMonths(date: Date, amount: number) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
}

function moveByMonths(date: Date, amount: number) {
  const first = addMonths(startOfMonth(date), amount)
  const lastDay = utcDate(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getUTCDate()
  return utcDate(first.getUTCFullYear(), first.getUTCMonth(), Math.min(date.getUTCDate(), lastDay))
}

function dayOffset(date: Date, weekStartsOn: number) {
  return (date.getUTCDay() - weekStartsOn + 7) % 7
}

function compareDates(a: Date, b: Date) {
  return dateKey(a).localeCompare(dateKey(b))
}

function inInterval(date: Date, first: Date, second: Date) {
  const start = compareDates(first, second) <= 0 ? first : second
  const end = compareDates(first, second) <= 0 ? second : first
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0
}

function calendarDays(month: Date, weekStartsOn: number) {
  const first = startOfMonth(month)
  const gridStart = addDays(first, -dayOffset(first, weekStartsOn))
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

function findAvailable(date: Date, direction: 1 | -1) {
  let candidate = date
  for (let index = 0; index < 14; index += 1) {
    if (!UNAVAILABLE_DATES.has(dateKey(candidate))) return candidate
    candidate = addDays(candidate, direction)
  }
  return date
}

function formatDate(date: Date, locale: LocaleCode, style: 'short' | 'long' = 'short') {
  return new Intl.DateTimeFormat(locale, {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: style === 'long' ? 'numeric' : undefined,
    weekday: style === 'long' ? 'long' : undefined,
    timeZone: 'UTC',
  }).format(date)
}

export default function LocaleAwareDateRange() {
  const [localeCode, setLocaleCode] = useState<LocaleCode>('en-US')
  const [visibleMonth, setVisibleMonth] = useState(INITIAL_MONTH)
  const [focusedDate, setFocusedDate] = useState(INITIAL_FOCUS_DATE)
  const [range, setRange] = useState<DateRange>({
    start: utcDate(2026, 7, 5),
    end: utcDate(2026, 7, 9),
  })
  const [previewDate, setPreviewDate] = useState<Date | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const locale = LOCALES.find((option) => option.code === localeCode) ?? LOCALES[0]
  const copy = COPY[localeCode]
  const titleId = useId()
  const helpId = useId()
  const dayRefs = useRef(new Map<string, HTMLButtonElement>())
  const shouldFocusDay = useRef(false)

  const days = useMemo(
    () => calendarDays(visibleMonth, locale.weekStartsOn),
    [locale.weekStartsOn, visibleMonth],
  )
  const weeks = useMemo(
    () => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days],
  )
  const weekdays = useMemo(() => {
    const sunday = utcDate(2026, 7, 2)
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(sunday, (locale.weekStartsOn + index) % 7)
      return {
        short: new Intl.DateTimeFormat(localeCode, { weekday: 'narrow', timeZone: 'UTC' }).format(
          date,
        ),
        long: new Intl.DateTimeFormat(localeCode, { weekday: 'long', timeZone: 'UTC' }).format(
          date,
        ),
      }
    })
  }, [locale.weekStartsOn, localeCode])
  const monthLabel = new Intl.DateTimeFormat(localeCode, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(visibleMonth)
  const dayNumber = useMemo(
    () => new Intl.NumberFormat(localeCode, { useGrouping: false }),
    [localeCode],
  )
  const presets: readonly Preset[] = [
    {
      label: copy.firstWeek,
      start: utcDate(2026, 7, 3),
      end: utcDate(2026, 7, 7),
    },
    {
      label: copy.launchWeek,
      start: utcDate(2026, 7, 24),
      end: utcDate(2026, 7, 28),
    },
  ]

  const focusedKey = dateKey(focusedDate)
  const visibleMonthKey = dateKey(visibleMonth)

  useEffect(() => {
    if (!shouldFocusDay.current) return
    shouldFocusDay.current = false
    dayRefs.current.get(focusedKey)?.focus()
  }, [focusedKey, visibleMonthKey])

  const moveFocus = (target: Date, direction: 1 | -1 = 1) => {
    const available = findAvailable(target, direction)
    shouldFocusDay.current = true
    setFocusedDate(available)
    setVisibleMonth(startOfMonth(available))
    if (range.start && !range.end) setPreviewDate(available)
  }

  const changeMonth = (amount: number) => {
    const nextMonth = addMonths(visibleMonth, amount)
    const nextFocus = findAvailable(
      utcDate(
        nextMonth.getUTCFullYear(),
        nextMonth.getUTCMonth(),
        Math.min(
          focusedDate.getUTCDate(),
          utcDate(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0).getUTCDate(),
        ),
      ),
      amount < 0 ? -1 : 1,
    )
    setVisibleMonth(nextMonth)
    setFocusedDate(nextFocus)
  }

  const selectDate = (date: Date) => {
    if (UNAVAILABLE_DATES.has(dateKey(date))) return

    if (!range.start || range.end) {
      setRange({ start: date, end: null })
      setPreviewDate(date)
      setAnnouncement(`${copy.start}: ${formatDate(date, localeCode, 'long')}. ${copy.chooseEnd}.`)
      return
    }

    const start = compareDates(date, range.start) < 0 ? date : range.start
    const end = compareDates(date, range.start) < 0 ? range.start : date
    const daysSelected = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    setRange({ start, end })
    setPreviewDate(null)
    setAnnouncement(
      `${copy.selected}: ${formatDate(start, localeCode)} ${copy.to} ${formatDate(end, localeCode)}, ${dayNumber.format(daysSelected)} ${copy.days}.`,
    )
  }

  const onGridKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const horizontalNext = locale.direction === 'rtl' ? -1 : 1
    let target: Date | null = null
    let direction: 1 | -1 = 1

    switch (event.key) {
      case 'ArrowLeft':
        direction = horizontalNext === 1 ? -1 : 1
        target = addDays(date, -horizontalNext)
        break
      case 'ArrowRight':
        direction = horizontalNext
        target = addDays(date, horizontalNext)
        break
      case 'ArrowUp':
        direction = -1
        target = addDays(date, -7)
        break
      case 'ArrowDown':
        target = addDays(date, 7)
        break
      case 'Home':
        direction = -1
        target = addDays(date, -dayOffset(date, locale.weekStartsOn))
        break
      case 'End':
        target = addDays(date, 6 - dayOffset(date, locale.weekStartsOn))
        break
      case 'PageUp':
        direction = -1
        target = moveByMonths(date, event.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        target = moveByMonths(date, event.shiftKey ? 12 : 1)
        break
      default:
        return
    }

    event.preventDefault()
    moveFocus(target, direction)
  }

  const pendingEnd = range.start && !range.end ? previewDate : null
  const isPreviewingRange = Boolean(
    range.start && pendingEnd && dateKey(range.start) !== dateKey(pendingEnd),
  )
  const displayEnd = range.end ?? pendingEnd
  const displayStart =
    range.start && displayEnd && compareDates(displayEnd, range.start) < 0
      ? displayEnd
      : range.start
  const displayRangeEnd =
    range.start && displayEnd && compareDates(displayEnd, range.start) < 0
      ? range.start
      : displayEnd
  const summary = range.start
    ? range.end
      ? `${formatDate(range.start, localeCode)} ${copy.to} ${formatDate(range.end, localeCode)}`
      : `${formatDate(range.start, localeCode)} ${copy.to} ${copy.chooseEnd}`
    : copy.chooseStart
  const selectedDays =
    range.start && range.end
      ? Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1
      : null

  return (
    <section
      dir={locale.direction}
      lang={localeCode.split('-')[0]}
      aria-labelledby={titleId}
      className="mx-auto w-full max-w-[640px] overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) text-sm sm:w-[640px]"
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-(--color-border) px-5 py-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-(--color-fg-subtle) uppercase">
            {copy.eyebrow}
          </p>
          <h2 id={titleId} className="mt-1 text-base font-medium text-(--color-fg)">
            {copy.title}
          </h2>
        </div>
        <div
          role="group"
          aria-label={copy.locale}
          className="flex overflow-hidden rounded-md border border-(--color-border)"
        >
          {LOCALES.map((option) => (
            <button
              key={option.code}
              type="button"
              lang={option.code.split('-')[0]}
              aria-pressed={localeCode === option.code}
              onClick={() => setLocaleCode(option.code)}
              className="border-e border-(--color-border) px-2.5 py-1.5 text-xs text-(--color-fg-muted) transition-colors first:rounded-s-[calc(var(--radius-md)-1px)] last:rounded-e-[calc(var(--radius-md)-1px)] last:border-e-0 hover:text-(--color-fg) aria-pressed:bg-(--color-accent-soft) aria-pressed:text-(--color-fg)"
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 p-5 md:grid-cols-[336px_132px] md:justify-center md:gap-8">
        <div className="mx-auto w-full max-w-[336px] min-w-0">
          <div className="mb-3 grid grid-cols-[32px_1fr_32px] items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label={copy.previousMonth}
              className="grid size-8 place-items-center rounded-md border border-(--color-border) text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg)"
            >
              {locale.direction === 'rtl' ? (
                <CaretRight aria-hidden="true" size={14} weight="regular" />
              ) : (
                <CaretLeft aria-hidden="true" size={14} weight="regular" />
              )}
            </button>
            <p className="text-center font-medium text-(--color-fg)" aria-live="polite">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label={copy.nextMonth}
              className="grid size-8 place-items-center rounded-md border border-(--color-border) text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg)"
            >
              {locale.direction === 'rtl' ? (
                <CaretLeft aria-hidden="true" size={14} weight="regular" />
              ) : (
                <CaretRight aria-hidden="true" size={14} weight="regular" />
              )}
            </button>
          </div>

          <div
            role="grid"
            aria-label={monthLabel}
            aria-describedby={helpId}
            aria-multiselectable="true"
            className="select-none"
            onPointerLeave={() => {
              setPreviewDate(range.start && !range.end ? focusedDate : null)
            }}
          >
            <div role="row" className="grid grid-cols-7">
              {weekdays.map((weekday) => (
                <div
                  key={weekday.long}
                  role="columnheader"
                  aria-label={weekday.long}
                  className="grid h-7 place-items-center text-center font-mono text-[10px] text-(--color-fg-subtle)"
                >
                  {weekday.short}
                </div>
              ))}
            </div>

            <div role="rowgroup" className="space-y-1">
              {weeks.map((week) => (
                <div key={dateKey(week[0]!)} role="row" className="grid grid-cols-7">
                  {week.map((date, dayIndex) => {
                    const key = dateKey(date)
                    const outside = date.getUTCMonth() !== visibleMonth.getUTCMonth()
                    const unavailable = UNAVAILABLE_DATES.has(key)
                    const isStart = range.start ? key === dateKey(range.start) : false
                    const isEnd = range.end ? key === dateKey(range.end) : false
                    const selected = Boolean(
                      !unavailable &&
                      range.start &&
                      (range.end ? inInterval(date, range.start, range.end) : isStart),
                    )
                    const previewed = Boolean(
                      !unavailable &&
                      range.start &&
                      pendingEnd &&
                      inInterval(date, range.start, pendingEnd),
                    )
                    const isInDisplayedRange = (candidate: Date | undefined) =>
                      Boolean(
                        candidate &&
                        displayStart &&
                        displayRangeEnd &&
                        !UNAVAILABLE_DATES.has(dateKey(candidate)) &&
                        inInterval(candidate, displayStart, displayRangeEnd),
                      )
                    const inDisplayRange = isInDisplayedRange(date)
                    const startsRangeSegment =
                      inDisplayRange && !isInDisplayedRange(week[dayIndex - 1])
                    const endsRangeSegment =
                      inDisplayRange && !isInDisplayedRange(week[dayIndex + 1])
                    const isCommittedEndpoint = isStart || isEnd
                    const isPreviewEndpoint = Boolean(
                      pendingEnd && key === dateKey(pendingEnd) && !isStart,
                    )
                    const rangeClasses = [
                      'relative flex h-9 items-center justify-center focus-within:z-10',
                      inDisplayRange && range.end ? 'bg-(--color-accent-soft)' : '',
                      inDisplayRange && !range.end && isPreviewingRange
                        ? 'border-y border-dashed border-(--color-border-strong)'
                        : '',
                      startsRangeSegment ? 'rounded-s-md' : '',
                      endsRangeSegment ? 'rounded-e-md' : '',
                      startsRangeSegment && !range.end && isPreviewingRange ? 'border-s' : '',
                      endsRangeSegment && !range.end && isPreviewingRange ? 'border-e' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    const classes = [
                      'relative grid size-8 place-items-center rounded-md font-mono text-xs tabular-nums outline-none transition-colors',
                      unavailable
                        ? 'cursor-not-allowed text-(--color-fg-subtle) opacity-50 line-through'
                        : isCommittedEndpoint
                          ? 'bg-(--color-accent) font-medium text-(--color-bg)'
                          : isPreviewEndpoint
                            ? 'border border-(--color-accent) bg-(--color-surface) font-medium text-(--color-fg)'
                            : selected
                              ? 'font-medium text-(--color-fg)'
                              : previewed
                                ? 'text-(--color-fg)'
                                : outside
                                  ? 'text-(--color-fg-subtle) opacity-45 hover:bg-(--color-surface-hover) hover:text-(--color-fg)'
                                  : 'text-(--color-fg-muted) hover:bg-(--color-surface-hover) hover:text-(--color-fg)',
                      isCommittedEndpoint
                        ? 'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-bg)'
                        : selected || previewed || isPreviewEndpoint
                          ? 'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-fg)'
                          : 'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <div
                        key={key}
                        role="gridcell"
                        aria-selected={Boolean(selected)}
                        className={rangeClasses}
                      >
                        <button
                          ref={(node) => {
                            if (node) dayRefs.current.set(key, node)
                            else dayRefs.current.delete(key)
                          }}
                          type="button"
                          tabIndex={key === focusedKey ? 0 : -1}
                          disabled={unavailable}
                          aria-label={`${formatDate(date, localeCode, 'long')}${unavailable ? `, ${copy.unavailable}` : ''}`}
                          onClick={() => selectDate(date)}
                          onFocus={() => {
                            setFocusedDate(date)
                            if (range.start && !range.end) setPreviewDate(date)
                          }}
                          onPointerEnter={() => {
                            if (range.start && !range.end && !unavailable) setPreviewDate(date)
                          }}
                          onKeyDown={(event) => onGridKeyDown(event, date)}
                          className={classes}
                        >
                          {dayNumber.format(date.getUTCDate())}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="mx-auto w-full max-w-[336px] border-t border-(--color-border) pt-4 md:mx-0 md:max-w-none md:border-t-0 md:pt-0">
          <p className="flex h-8 items-center font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            {copy.presets}
          </p>
          <div className="mt-2 space-y-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setRange({ start: preset.start, end: preset.end })
                  setVisibleMonth(startOfMonth(preset.start))
                  setFocusedDate(preset.start)
                  setPreviewDate(null)
                  setAnnouncement(`${copy.selected}: ${preset.label}.`)
                }}
                aria-pressed={
                  range.start !== null &&
                  range.end !== null &&
                  dateKey(range.start) === dateKey(preset.start) &&
                  dateKey(range.end) === dateKey(preset.end)
                }
                className="block min-h-8 w-full rounded-md px-2 py-1.5 text-start text-xs text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg) aria-pressed:bg-(--color-accent-soft) aria-pressed:text-(--color-fg)"
              >
                {preset.label}
              </button>
            ))}
            <div className="mt-2 border-t border-(--color-border) pt-2">
              <button
                type="button"
                onClick={() => {
                  setRange({ start: null, end: null })
                  setPreviewDate(null)
                  setAnnouncement(copy.chooseStart)
                }}
                className="block min-h-8 w-full rounded-md px-2 py-1.5 text-start text-xs text-(--color-fg-subtle) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg)"
              >
                {copy.clear}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) bg-(--color-bg) px-5 py-3">
        <p className="min-w-0 text-xs text-(--color-fg-muted)">
          <span className="text-(--color-fg)">{summary}</span>
          {selectedDays ? (
            <span className="ms-2 font-mono text-[10px] text-(--color-fg-subtle)">
              {dayNumber.format(selectedDays)} {copy.days}
            </span>
          ) : null}
        </p>
        <p
          id={helpId}
          className="flex flex-wrap gap-x-3 font-mono text-[10px] text-(--color-fg-subtle)"
        >
          {copy.keyboard.map((instruction) => (
            <span key={instruction}>{instruction}</span>
          ))}
        </p>
      </footer>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </section>
  )
}
