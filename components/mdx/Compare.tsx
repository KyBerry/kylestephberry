import NextImage from 'next/image'

interface CompareProps {
  before: string
  beforeAlt: string
  beforeLabel?: string
  after: string
  afterAlt: string
  afterLabel?: string
  width: number
  height: number
}

export function Compare({
  before,
  beforeAlt,
  beforeLabel = 'Before',
  after,
  afterAlt,
  afterLabel = 'After',
  width,
  height,
}: CompareProps) {
  return (
    <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[
        { src: before, alt: beforeAlt, label: beforeLabel },
        { src: after, alt: afterAlt, label: afterLabel },
      ].map((item) => (
        <figure key={item.label}>
          <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-(--color-fg-subtle) uppercase">
            {item.label}
          </p>
          <NextImage
            src={item.src}
            alt={item.alt}
            width={width}
            height={height}
            sizes="(min-width: 640px) 50vw, 100vw"
            className="rounded-(--radius-card) border border-(--color-border)"
          />
        </figure>
      ))}
    </div>
  )
}
