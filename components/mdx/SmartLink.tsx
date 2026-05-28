import type { AnchorHTMLAttributes } from 'react'
import NextLink from 'next/link'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

type SmartLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

export function SmartLink({ href, children, className, ...rest }: SmartLinkProps) {
  const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} {...rest}>
        {children}
        <ArrowUpRight
          weight="regular"
          size={11}
          className="ml-0.5 inline-block translate-y-px opacity-60"
        />
      </a>
    )
  }
  return (
    <NextLink href={href} className={className}>
      {children}
    </NextLink>
  )
}
