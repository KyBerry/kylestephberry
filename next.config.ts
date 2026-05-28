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
    // Strings rather than imports so Turbopack can serialize loader options.
    // remark-frontmatter recognises the ---...--- block so it isn't rendered
    // as page text. content-collections still parses the frontmatter
    // separately for typing; this plugin just tells the MDX compiler to
    // skip it.
    remarkPlugins: [['remark-frontmatter', ['yaml']]],
    rehypePlugins: [['rehype-pretty-code', rehypePrettyCodeOptions]],
  },
})

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
}

// withContentCollections must be the outermost plugin.
export default withContentCollections(withMDX(nextConfig))
