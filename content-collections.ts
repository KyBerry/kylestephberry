import {
  createDefaultImport,
  defineCollection,
  defineConfig,
  defineSingleton,
} from '@content-collections/core'
import { z } from 'zod'
import path from 'node:path'
import { readFile, readdir } from 'node:fs/promises'
import sharp from 'sharp'
import { highlightCodeToHast } from './lib/content/shiki-hast'
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
  transform: async (doc, { skip, collection }) => {
    if (doc.draft) return skip('post marked draft')
    const slug = doc._meta.filePath.replace(/\.mdx$/, '').split('/').pop() ?? doc._meta.path

    // Compute reading time from the file body
    const rawBody = await readFile(
      path.resolve(process.cwd(), 'content/posts', doc._meta.filePath),
      'utf-8',
    )
    // Strip frontmatter for the word count
    const bodyOnly = rawBody.replace(/^---[\s\S]*?\n---\n/, '')
    const { default: readingTime } = await import('reading-time')
    const readingTimeText = readingTime(bodyOnly).text // e.g. "5 min read"

    // Static-import the compiled MDX module so Next bundles it
    const MDXContent = createDefaultImport<ComponentType>(
      `@/content/posts/${doc._meta.filePath}`,
    )

    // Sibling navigation (chronological newest-first)
    const docs = await collection.documents()
    const sorted = [...docs]
      .filter((d) => !d.draft)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    const idx = sorted.findIndex((d) => d._meta.filePath === doc._meta.filePath)
    const newer = idx > 0 ? sorted[idx - 1] : null // newer = previous index (smaller idx)
    const older = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null

    return {
      ...doc,
      slug,
      url: `/blog/${slug}`,
      readingTime: readingTimeText,
      MDXContent,
      newerSlug: newer
        ? (newer._meta.filePath.replace(/\.mdx$/, '').split('/').pop() ?? null)
        : null,
      newerTitle: newer?.title ?? null,
      olderSlug: older
        ? (older._meta.filePath.replace(/\.mdx$/, '').split('/').pop() ?? null)
        : null,
      olderTitle: older?.title ?? null,
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
    const dir = path.dirname(doc._meta.filePath)
    const slug = dir
    const componentRelPath = path.join('content/showcase', dir, 'component.tsx')
    const variantsDirRel = path.join('content/showcase', dir, 'variants')

    // Default component source + HAST tree
    const sourceText = await readFile(path.resolve(process.cwd(), componentRelPath), 'utf-8')
    const sourceHast = await cache(`hast:${slug}:default:${sourceText.length}`, () =>
      highlightCodeToHast(sourceText, 'tsx'),
    )

    // Notes (MDX body of index.mdx), bundled by Next via static import
    const NotesMDX = createDefaultImport<ComponentType>(`@/content/showcase/${dir}/index.mdx`)

    // Default component, bundled via static import
    const Component = createDefaultImport<ComponentType>(`@/content/showcase/${dir}/component`)

    // Variant sources: read any *.tsx in variants/ (filtered by frontmatter allow-list if given)
    type VariantRecord = {
      sourceText: string
      sourceHast: Awaited<ReturnType<typeof highlightCodeToHast>>
    }
    const variantSources: Record<string, VariantRecord> = {}
    const variantComponents: Record<
      string,
      ReturnType<typeof createDefaultImport<ComponentType>>
    > = {}

    let variantFiles: string[] = []
    try {
      const all = await readdir(path.resolve(process.cwd(), variantsDirRel))
      variantFiles = all.filter((f) => f.endsWith('.tsx'))
    } catch {
      // No variants directory — leave variantSources empty.
    }

    if (doc.variants && doc.variants.length > 0) {
      const allow = new Set(doc.variants)
      variantFiles = variantFiles.filter((f) => allow.has(f))
    }

    for (const file of variantFiles) {
      const name = file.replace(/\.tsx$/, '')
      const text = await readFile(path.resolve(process.cwd(), variantsDirRel, file), 'utf-8')
      const hast = await cache(`hast:${slug}:${name}:${text.length}`, () =>
        highlightCodeToHast(text, 'tsx'),
      )
      variantSources[name] = { sourceText: text, sourceHast: hast }
      variantComponents[name] = createDefaultImport<ComponentType>(
        `@/content/showcase/${dir}/variants/${name}`,
      )
    }

    return {
      ...doc,
      slug,
      url: `/components/${slug}`,
      sourceText,
      sourceHast,
      Component,
      NotesMDX,
      variantSources,
      variantComponents,
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
    const slug =
      doc._meta.filePath
        .replace(/\.ya?ml$/, '')
        .split('/')
        .pop() ?? doc._meta.path

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
