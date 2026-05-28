/**
 * derive-design-blurhashes
 *
 * Walks `content/designs/*.yaml`, runs sharp on each referenced image, and
 * writes blurDataURLs to `content/.cache/design-blur.json` keyed by image
 * path. Each cache entry stores the source image's mtimeMs so repeat runs
 * skip work for unchanged files.
 *
 * Run via: node --experimental-strip-types scripts/derive-design-blurhashes.ts
 * Wired as the project's `prebuild` step so production builds always start
 * from a fresh cache.
 *
 * The runtime designs transform in `content-collections.ts` reads from this
 * cache when an entry exists, and falls back to computing inline when one
 * does not (so `pnpm dev` without a prebuild still works).
 */
import path from 'node:path'
import { readFile, readdir, stat, mkdir, writeFile, rename } from 'node:fs/promises'
import sharp from 'sharp'
import { parse as parseYaml } from 'yaml'

type CacheEntry = {
  mtime: number
  blurDataURL: string
}
type Cache = Record<string, CacheEntry>

const PROJECT_ROOT = process.cwd()
const DESIGNS_DIR = path.resolve(PROJECT_ROOT, 'content/designs')
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, 'public')
const CACHE_DIR = path.resolve(PROJECT_ROOT, 'content/.cache')
const CACHE_FILE = path.resolve(CACHE_DIR, 'design-blur.json')
const CACHE_TMP_FILE = `${CACHE_FILE}.tmp`

async function readExistingCache(): Promise<Cache> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Cache
    }
  } catch {
    // Missing or malformed cache — start fresh.
  }
  return {}
}

async function listYamlEntries(): Promise<string[]> {
  let files: string[]
  try {
    files = await readdir(DESIGNS_DIR)
  } catch {
    return []
  }
  return files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).sort()
}

async function readImagePathFromYaml(yamlPath: string): Promise<string | null> {
  const raw = await readFile(yamlPath, 'utf-8')
  const doc = parseYaml(raw) as unknown
  if (doc && typeof doc === 'object' && 'image' in doc) {
    const image = (doc as { image: unknown }).image
    if (typeof image === 'string' && image.length > 0) return image
  }
  return null
}

async function computeBlur(absImagePath: string): Promise<string> {
  const buffer = await sharp(absImagePath).resize(16).blur(4).png().toBuffer()
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function writeCacheAtomic(cache: Cache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  // Sort keys for deterministic output.
  const sorted: Cache = {}
  for (const key of Object.keys(cache).sort()) {
    sorted[key] = cache[key]!
  }
  const payload = `${JSON.stringify(sorted, null, 2)}\n`
  await writeFile(CACHE_TMP_FILE, payload, 'utf-8')
  await rename(CACHE_TMP_FILE, CACHE_FILE)
}

async function main() {
  const startedAt = Date.now()
  const existing = await readExistingCache()
  const next: Cache = {}

  const yamlFiles = await listYamlEntries()
  if (yamlFiles.length === 0) {
    console.log('[derive-design-blurhashes] no design YAML files found; nothing to do')
    // Still write an empty cache to keep downstream code's read path simple.
    await writeCacheAtomic(next)
    return
  }

  // Collect (yaml, image) pairs; multiple YAMLs may legitimately share an image.
  const imagePaths = new Set<string>()
  for (const file of yamlFiles) {
    const yamlAbs = path.join(DESIGNS_DIR, file)
    const image = await readImagePathFromYaml(yamlAbs)
    if (image) imagePaths.add(image)
    else console.warn(`[derive-design-blurhashes] ${file}: no 'image' field; skipping`)
  }

  let hits = 0
  let misses = 0
  let missing = 0

  for (const image of imagePaths) {
    const absImagePath = path.resolve(PUBLIC_DIR, image.replace(/^\//, ''))
    let mtimeMs: number
    try {
      const s = await stat(absImagePath)
      mtimeMs = s.mtimeMs
    } catch {
      console.warn(`[derive-design-blurhashes] ${image}: file missing at ${absImagePath}; skipping`)
      missing += 1
      continue
    }

    const cached = existing[image]
    if (cached && cached.mtime === mtimeMs) {
      next[image] = cached
      hits += 1
      continue
    }

    const blurDataURL = await computeBlur(absImagePath)
    next[image] = { mtime: mtimeMs, blurDataURL }
    misses += 1
  }

  await writeCacheAtomic(next)

  const ms = Date.now() - startedAt
  console.log(
    `[derive-design-blurhashes] ${imagePaths.size} image(s): ${hits} cached, ${misses} computed${
      missing ? `, ${missing} missing` : ''
    } (${ms}ms)`,
  )
}

main().catch((err) => {
  console.error('[derive-design-blurhashes] failed:', err)
  process.exit(1)
})
