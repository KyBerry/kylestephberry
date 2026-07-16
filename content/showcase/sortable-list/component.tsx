'use client'

import { useId, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Drag-to-reorder with a first-class keyboard path: grab with Space, move
 * with arrows, drop with Space, cancel with Escape. Every move is announced
 * to a live region, and neighbor shifts animate unless motion is reduced.
 */

const ITEM_H = 48
const GAP = 8
const STRIDE = ITEM_H + GAP

interface Item {
  id: string
  title: string
  author: string
}

const INITIAL_ITEMS: Item[] = [
  { id: 'elements', title: 'The Elements of Typographic Style', author: 'Robert Bringhurst' },
  { id: 'thinking', title: 'How to Make Sense of Any Mess', author: 'Abby Covert' },
  { id: 'form', title: 'Notes on the Synthesis of Form', author: 'Christopher Alexander' },
  { id: 'grid', title: 'Grid Systems in Graphic Design', author: 'Josef Müller-Brockmann' },
  { id: 'everyday', title: 'The Design of Everyday Things', author: 'Don Norman' },
]

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onStoreChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

function moveItem(items: Item[], from: number, to: number): Item[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (!moved) return items
  next.splice(to, 0, moved)
  return next
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export default function SortableList() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragDy, setDragDy] = useState(0)
  const [grabbedId, setGrabbedId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const startYRef = useRef(0)
  const dyRef = useRef(0)
  const orderBeforeGrab = useRef<Item[]>([])
  const reducedMotion = usePrefersReducedMotion()
  const instructionsId = useId()

  const count = items.length
  const projectedIndex =
    dragIndex !== null ? clamp(dragIndex + Math.round(dragDy / STRIDE), 0, count - 1) : null

  /* Pointer path ------------------------------------------------------- */

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (grabbedId !== null) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startYRef.current = e.clientY
    dyRef.current = 0
    setDragDy(0)
    setDragIndex(index)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragIndex === null) return
    dyRef.current = e.clientY - startYRef.current
    setDragDy(dyRef.current)
  }

  const onPointerEnd = () => {
    if (dragIndex === null) return
    const target = clamp(dragIndex + Math.round(dyRef.current / STRIDE), 0, count - 1)
    const moved = items[dragIndex]
    if (target !== dragIndex && moved) {
      setItems((current) => moveItem(current, dragIndex, target))
      setAnnouncement(`Moved ${moved.title} to position ${target + 1} of ${count}.`)
    }
    setDragIndex(null)
    setDragDy(0)
    dyRef.current = 0
  }

  /* Keyboard path ------------------------------------------------------ */

  const onHandleKeyDown = (e: React.KeyboardEvent, item: Item, index: number) => {
    const grabbed = grabbedId === item.id

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!grabbed) {
        orderBeforeGrab.current = items
        setGrabbedId(item.id)
        setAnnouncement(
          `Grabbed ${item.title}, position ${index + 1} of ${count}. ` +
            'Arrow keys to move, Space to drop, Escape to cancel.',
        )
      } else {
        setGrabbedId(null)
        setAnnouncement(`Dropped ${item.title} at position ${index + 1} of ${count}.`)
      }
      return
    }

    if (!grabbed) return

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const target = clamp(index + (e.key === 'ArrowUp' ? -1 : 1), 0, count - 1)
      if (target !== index) {
        setItems((current) => moveItem(current, index, target))
        setAnnouncement(`${item.title}, position ${target + 1} of ${count}.`)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      const original = orderBeforeGrab.current.findIndex((i) => i.id === item.id)
      setItems(orderBeforeGrab.current)
      setGrabbedId(null)
      setAnnouncement(
        `Reorder cancelled. ${item.title} returned to position ${original + 1} of ${count}.`,
      )
    }
  }

  /* Render ------------------------------------------------------------- */

  const shiftFor = (index: number): number => {
    if (dragIndex === null || projectedIndex === null || index === dragIndex) return 0
    if (dragIndex < projectedIndex && index > dragIndex && index <= projectedIndex) return -STRIDE
    if (dragIndex > projectedIndex && index < dragIndex && index >= projectedIndex) return STRIDE
    return 0
  }

  return (
    <div className="mx-auto w-md max-w-full">
      <p
        id={instructionsId}
        className="mb-3 font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase"
      >
        Reading list · drag the handle, or focus it and press Space
      </p>

      <ol className="relative" style={{ height: count * STRIDE - GAP }}>
        {items.map((item, index) => {
          const isDragged = dragIndex === index
          const isGrabbed = grabbedId === item.id
          const y = index * STRIDE + (isDragged ? dragDy : shiftFor(index))

          return (
            <li
              key={item.id}
              className={`absolute inset-x-0 flex items-center gap-3 rounded-(--radius-card) border bg-(--color-surface) px-3 ${
                isDragged || isGrabbed
                  ? 'z-10 border-(--color-border-strong)'
                  : 'border-(--color-border)'
              }`}
              style={{
                height: ITEM_H,
                transform: `translateY(${y}px)`,
                transition:
                  isDragged || reducedMotion ? 'none' : 'transform 160ms cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <button
                type="button"
                aria-label={`Reorder ${item.title}, position ${index + 1} of ${count}`}
                aria-describedby={instructionsId}
                aria-pressed={isGrabbed}
                onPointerDown={(e) => onPointerDown(e, index)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onKeyDown={(e) => onHandleKeyDown(e, item, index)}
                className={`touch-none rounded px-1.5 py-1 font-mono text-sm select-none ${
                  isGrabbed
                    ? 'bg-(--color-accent-soft) text-(--color-fg)'
                    : 'cursor-grab text-(--color-fg-subtle) hover:text-(--color-fg)'
                }`}
              >
                ⠿
              </button>
              <span className="min-w-0">
                <span className="block truncate text-sm text-(--color-fg)">{item.title}</span>
                <span className="block font-mono text-[10px] text-(--color-fg-subtle)">
                  {item.author}
                </span>
              </span>
              <span className="ml-auto font-mono text-[10px] text-(--color-fg-subtle)">
                {index + 1}
              </span>
            </li>
          )
        })}
      </ol>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <p className="mt-3 h-4 font-mono text-[10px] text-(--color-fg-subtle)" aria-hidden="true">
        {grabbedId !== null ? '↑↓ move · space drop · esc cancel' : announcement}
      </p>
    </div>
  )
}
