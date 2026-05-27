import {
  createDefaultImport,
  defineCollection,
  defineConfig,
  defineSingleton,
} from '@content-collections/core'
import { z } from 'zod'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { highlightCode } from './lib/content/shiki'
import type { ComponentType } from 'react'

/* ---------------------------------------------------------------- *
 * Posts
 * ---------------------------------------------------------------- */

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '**/*.mdx',
  parser: 'frontmatter-only', // body is bundled by Turbopack via static import below
  schema: z.object({
    title: z.string(),
    summary: z.string().max(180),
    publishedAt: z.string(), // ISO date string (zod doesn't ship a 'date' type cleanly)
    updatedAt: z.string().nullable().default(null),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    heroImage: z.string().nullable().default(null),
    heroAlt: z.string().nullable().default(null),
  }),
  transform: (doc, { skip }) => {
    if (doc.draft) return skip('post marked draft')
    const slug = doc._meta.filePath.replace(/\.mdx$/, '').split('/').pop() ?? doc._meta.path
    // NOTE: MDX body rendering is deferred to Plan 6 (blog). That plan adds
    // @next/mdx + a createDefaultImport<ComponentType> for the .mdx file here.
    // Plan 2 only exposes metadata; the body string is not part of allPosts.
    return {
      ...doc,
      slug,
      url: `/blog/${slug}`,
    }
  },
})

/* ---------------------------------------------------------------- *
 * Showcase
 *
 * Each entry lives in a directory: content/showcase/<slug>/
 *   index.mdx        — frontmatter + optional written notes (body is MDX)
 *   component.tsx    — default-exported React component
 *   variants/*.tsx   — (optional) alt versions, added in Plan 4+
 *
 * The transform inlines the sibling component.tsx source as text +
 * pre-rendered Shiki HTML, and exposes the component via createDefaultImport.
 * ---------------------------------------------------------------- */

const showcase = defineCollection({
  name: 'showcase',
  directory: 'content/showcase',
  include: '**/index.mdx',
  parser: 'frontmatter-only',
  schema: z.object({
    title: z.string(),
    summary: z.string().max(180),
    publishedAt: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    mountStrategy: z.enum(['always', 'on-hover']).default('always'),
    variants: z.array(z.string()).nullable().default(null),
  }),
  transform: async (doc, { cache }) => {
    // doc._meta.filePath looks like 'hello-button/index.mdx' (relative to the collection dir)
    const dir = path.dirname(doc._meta.filePath)
    const slug = dir
    const componentRelPath = path.join('content/showcase', dir, 'component.tsx')

    const sourceText = await readFile(
      path.resolve(process.cwd(), componentRelPath),
      'utf-8',
    )

    const sourceHtml = await cache(sourceText, (code) => highlightCode(code, 'tsx'))

    const Component = createDefaultImport<ComponentType>(
      `@/content/showcase/${dir}/component`,
    )

    return {
      ...doc,
      slug,
      url: `/components/${slug}`,
      sourceText,
      sourceHtml,
      Component,
      // Plan 4 will populate variant sources; for Plan 2 we leave them empty.
      variantSources: {} as Record<string, { sourceText: string; sourceHtml: string }>,
    }
  },
})

/* ---------------------------------------------------------------- *
 * Designs
 * ---------------------------------------------------------------- */

const designs = defineCollection({
  name: 'designs',
  directory: 'content/designs',
  include: '**/*.yaml',
  parser: 'yaml',
  schema: z.object({
    title: z.string(),
    summary: z.string().nullable().default(null),
    image: z.string(), // e.g. '/designs/sample.png'
    imageAlt: z.string(),
    imageWidth: z.number().int().positive(),
    imageHeight: z.number().int().positive(),
    figmaUrl: z.string().url().nullable().default(null),
    tags: z.array(z.string()).default([]),
    publishedAt: z.string(),
    featured: z.boolean().default(false),
  }),
  transform: async (doc, { cache }) => {
    const slug = doc._meta.filePath.replace(/\.ya?ml$/, '').split('/').pop() ?? doc._meta.path

    const blurDataURL = await cache(`blur:${doc.image}`, async () => {
      const absPath = path.resolve(process.cwd(), 'public', doc.image.replace(/^\//, ''))
      const buffer = await sharp(absPath).resize(16).blur(4).png().toBuffer()
      return `data:image/png;base64,${buffer.toString('base64')}`
    })

    return {
      ...doc,
      slug,
      blurDataURL,
    }
  },
})

/* ---------------------------------------------------------------- *
 * Work (singleton)
 * ---------------------------------------------------------------- */

const work = defineSingleton({
  name: 'work',
  filePath: 'content/work.yaml',
  parser: 'yaml',
  schema: z.object({
    entries: z.array(
      z.object({
        years: z.string(),
        role: z.string(),
        company: z.string(),
        companyUrl: z.string().url().nullable().default(null),
        context: z.string(),
      }),
    ),
  }),
})

/* ---------------------------------------------------------------- */

export default defineConfig({
  content: [posts, showcase, designs, work],
})
