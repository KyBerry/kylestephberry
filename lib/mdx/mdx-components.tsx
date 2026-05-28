import type { MDXComponents } from 'mdx/types'
import { Callout } from '@/components/mdx/Callout'
import { Image } from '@/components/mdx/Image'
import { Video } from '@/components/mdx/Video'
import { Figma } from '@/components/mdx/Figma'
import { Tweet } from '@/components/mdx/Tweet'
import { SmartLink } from '@/components/mdx/SmartLink'
import { Steps } from '@/components/mdx/Steps'
import { Compare } from '@/components/mdx/Compare'
import { ShowcaseEmbed } from '@/components/mdx/ShowcaseEmbed'

export const sharedMDXComponents: MDXComponents = {
  Callout,
  Image,
  Video,
  Figma,
  Tweet,
  Steps,
  Compare,
  // Inline a showcase entry inside any post: <Showcase slug="hello-button" />
  Showcase: ShowcaseEmbed,
  // Override the default <a> rendering so internal links are next/link and external get an arrow
  a: ({ href, children, ...rest }) => (
    <SmartLink href={href ?? '#'} {...rest}>
      {children}
    </SmartLink>
  ),
}
