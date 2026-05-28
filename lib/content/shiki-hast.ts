import type { Root } from 'hast'
import { getHighlighter } from './shiki'

/**
 * Run Shiki and return the result as a HAST tree (plain JSON-serializable
 * objects). The consumer renders the tree to React via `hast-util-to-jsx-runtime`.
 */
export async function highlightCodeToHast(code: string, lang = 'tsx'): Promise<Root> {
  const hl = await getHighlighter()
  return hl.codeToHast(code, { lang, theme: 'vesper' })
}
