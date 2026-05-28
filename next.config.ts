import type { NextConfig } from 'next'
import { withContentCollections } from '@content-collections/next'
import createMDX from '@next/mdx'

const rehypePrettyCodeOptions = {
  theme: 'vesper',
  keepBackground: false, // surface background comes from Tailwind
  defaultLang: { block: 'tsx', inline: 'tsx' },
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    // Strings rather than imports so Turbopack can serialize loader options.
    rehypePlugins: [['rehype-pretty-code', rehypePrettyCodeOptions]],
  },
})

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
}

// withContentCollections must be the outermost plugin.
export default withContentCollections(withMDX(nextConfig))
