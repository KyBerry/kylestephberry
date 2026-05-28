interface VideoProps {
  src: string
  caption?: string
  loop?: boolean
  autoPlay?: boolean
  muted?: boolean
  poster?: string
}

export function Video({
  src,
  caption,
  loop = true,
  autoPlay = true,
  muted = true,
  poster,
}: VideoProps) {
  return (
    <figure className="my-6">
      <video
        src={src}
        loop={loop}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        controls
        poster={poster}
        className="w-full rounded-(--radius-card) border border-(--color-border)"
      />
      {caption ? (
        <figcaption className="mt-2 text-center font-mono text-xs text-(--color-fg-subtle)">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
