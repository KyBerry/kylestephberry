import NextImage from 'next/image'

interface ImageProps {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
}

export function Image({ src, alt, width, height, caption }: ImageProps) {
  return (
    <figure className="my-6">
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 768px) 720px, 100vw"
        className="rounded-(--radius-card) border border-(--color-border)"
      />
      {caption ? (
        <figcaption className="mt-2 text-center font-mono text-xs text-(--color-fg-subtle)">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
