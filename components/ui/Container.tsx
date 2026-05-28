import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type ContainerVariant = 'prose' | 'grid' | 'hero'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ContainerVariant
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav'
}

const variantClass: Record<ContainerVariant, string> = {
  prose: 'max-w-[var(--container-prose)]',
  grid: 'max-w-[var(--container-grid)]',
  hero: 'max-w-[var(--container-hero)]',
}

export function Container({
  variant = 'grid',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full px-6 md:px-8', variantClass[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}
