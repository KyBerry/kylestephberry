import type { ElementContent, Root, RootContent } from 'hast'
import { getHighlighter } from './shiki'

/**
 * A trimmed, content-collections-serializable shape of a HAST tree.
 *
 * The real `hast.Root` includes optional `position` and `data` fields whose
 * types (`Position | undefined`, etc.) are not assignable to
 * content-collections' `SchemaType` (which is `Literal | object | array`).
 * We declare our own shape — at runtime we strip those fields from Shiki's
 * output before returning, so the cached JSON matches.
 *
 * The shape is wide enough that `hast-util-to-jsx-runtime` accepts it via a
 * cast at the consumer.
 */
export type SerializableHast = {
  type: 'root'
  children: SerializableHastChild[]
}

type HastPropertyValue = string | number | boolean | null | HastPropertyValue[]

export type SerializableHastChild =
  | {
      type: 'element'
      tagName: string
      properties: { [key: string]: HastPropertyValue }
      children: SerializableHastChild[]
    }
  | { type: 'text'; value: string }
  | { type: 'comment'; value: string }
  | { type: 'doctype' }

/**
 * Run Shiki and return the result as a HAST tree (plain JSON-serializable
 * objects). The consumer renders the tree to React via `hast-util-to-jsx-runtime`.
 *
 * Strips `position` and `data` from every node so content-collections can
 * include the tree in its generated JSON.
 */
export async function highlightCodeToHast(code: string, lang = 'tsx'): Promise<SerializableHast> {
  const hl = await getHighlighter()
  const tree = hl.codeToHast(code, { lang, theme: 'vesper' })
  return stripRoot(tree)
}

function stripRoot(node: Root): SerializableHast {
  return {
    type: 'root',
    children: node.children.map(stripNode),
  }
}

function stripNode(node: RootContent | ElementContent): SerializableHastChild {
  if (node.type === 'element') {
    return {
      type: 'element',
      tagName: node.tagName,
      properties: serialiseProps(node.properties),
      children: (node.children ?? []).map((c) => stripNode(c)),
    }
  }
  if (node.type === 'text') {
    return { type: 'text', value: node.value }
  }
  if (node.type === 'comment') {
    return { type: 'comment', value: node.value }
  }
  if (node.type === 'doctype') {
    return { type: 'doctype' }
  }
  // Fallback — should not occur for Shiki output.
  return { type: 'text', value: '' }
}

function serialiseProps(props: Record<string, unknown> | null | undefined): {
  [key: string]: HastPropertyValue
} {
  const out: { [key: string]: HastPropertyValue } = {}
  if (!props) return out
  for (const [k, v] of Object.entries(props)) {
    const cleaned = cleanValue(v)
    if (cleaned !== undefined) out[k] = cleaned
  }
  return out
}

function cleanValue(v: unknown): HastPropertyValue | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  if (Array.isArray(v)) {
    const arr: HastPropertyValue[] = []
    for (const item of v) {
      const c = cleanValue(item)
      if (c !== undefined) arr.push(c)
    }
    return arr
  }
  // Drop anything else (objects, functions, symbols) — Shiki shouldn't emit them.
  return undefined
}
