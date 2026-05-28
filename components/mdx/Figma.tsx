interface FigmaProps {
  url: string
  height?: number
  caption?: string
}

export function Figma({ url, height = 450, caption }: FigmaProps) {
  const embedUrl = `https://www.figma.com/embed?embed_host=portfolio&url=${encodeURIComponent(url)}`
  return (
    <figure className="my-6">
      <div
        className="overflow-hidden rounded-(--radius-card) border border-(--color-border)"
        style={{ height }}
      >
        <iframe
          src={embedUrl}
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
          title={caption ?? 'Figma frame'}
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center font-mono text-xs text-(--color-fg-subtle)">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
