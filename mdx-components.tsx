import type { MDXComponents } from 'mdx/types'
import { sharedMDXComponents } from '@/lib/mdx/mdx-components'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...sharedMDXComponents,
  }
}
