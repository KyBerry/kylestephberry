import type { Highlighter } from 'shiki'
import { createHighlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vesper'],
      langs: ['tsx', 'ts', 'jsx', 'js', 'json', 'bash', 'css', 'html', 'md', 'mdx', 'yaml'],
    })
  }
  return highlighterPromise
}

/** HTML-string flavour, still used by older callers if needed. */
export async function highlightCode(code: string, lang = 'tsx'): Promise<string> {
  const hl = await getHighlighter()
  return hl.codeToHtml(code, { lang, theme: 'vesper' })
}
