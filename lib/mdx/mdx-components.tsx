import type { MDXComponents } from 'mdx/types'

/**
 * Shared MDX component overrides — used by blog posts (Plan 6) and showcase
 * notes (Plan 4). Plan 6 adds: Callout, Showcase, Image, Video, Figma, Tweet,
 * Link, Steps, Compare.
 *
 * Default tag-name overrides (h1-h6, p, a, etc.) aren't set here — prose
 * styling is handled at the container level (see .prose-portfolio in
 * app/globals.css) so showcase notes and blog post bodies can have different
 * reading widths.
 */
export const sharedMDXComponents: MDXComponents = {
  // Plan 6 adds entries here.
}
