import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const localesDirectory = path.join(root, 'src', 'i18n', 'locales')
const sourceDirectory = path.join(root, 'src')
const referenceLocale = 'en'
const storyCount = 14
const localeFiles = fs.readdirSync(localesDirectory).filter((file) => file.endsWith('.json')).sort()

const flatten = (value, prefix = '', result = new Map()) => {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, fullKey, result)
    else result.set(fullKey, child)
  }
  return result
}

// JSON.parse silently accepts duplicate properties. This scanner retains object
// nesting so duplicate translation keys are visible in CI without dependencies.
const duplicateKeys = (text) => {
  const duplicates = []
  const stack = []
  let index = 0
  let expectingKey = false
  while (index < text.length) {
    const character = text[index]
    if (character === '"') {
      const start = index
      index++
      while (index < text.length) {
        if (text[index] === '\\') index += 2
        else if (text[index++] === '"') break
      }
      if (expectingKey && stack.at(-1)?.type === 'object') {
        const key = JSON.parse(text.slice(start, index))
        let cursor = index
        while (/\s/.test(text[cursor] ?? '')) cursor++
        if (text[cursor] === ':') {
          const context = stack.at(-1)
          if (context.keys.has(key)) duplicates.push([...stack.filter((item) => item.key).map((item) => item.key), key].join('.'))
          context.keys.add(key)
          context.pendingKey = key
          expectingKey = false
        }
      }
      continue
    }
    if (character === '{') {
      const parent = stack.at(-1)
      stack.push({ type: 'object', keys: new Set(), key: parent?.pendingKey })
      if (parent) parent.pendingKey = undefined
      expectingKey = true
    } else if (character === '[') {
      const parent = stack.at(-1)
      stack.push({ type: 'array', key: parent?.pendingKey })
      if (parent) parent.pendingKey = undefined
      expectingKey = false
    } else if (character === '}' || character === ']') {
      stack.pop()
      expectingKey = stack.at(-1)?.type === 'object'
    } else if (character === ',') expectingKey = stack.at(-1)?.type === 'object'
    index++
  }
  return duplicates
}

const bundles = new Map()
let failed = false
for (const file of localeFiles) {
  const locale = path.basename(file, '.json')
  const text = fs.readFileSync(path.join(localesDirectory, file), 'utf8')
  const duplicates = duplicateKeys(text)
  if (duplicates.length) {
    failed = true
    console.error(`[${locale}] duplicate keys: ${duplicates.join(', ')}`)
  }
  bundles.set(locale, flatten(JSON.parse(text)))
}

const reference = bundles.get(referenceLocale)
if (!reference) throw new Error(`Reference locale ${referenceLocale} does not exist.`)

const requiredStoryKeys = Array.from({ length: storyCount }, (_, index) => [
  `stops.stop${index + 1}.title`,
  `stops.stop${index + 1}.description`,
]).flat()
const missingReferenceStoryKeys = requiredStoryKeys.filter((key) => !reference.has(key))
if (missingReferenceStoryKeys.length) {
  failed = true
  console.error(`[${referenceLocale}] missing required story translations: ${missingReferenceStoryKeys.join(', ')}`)
}

for (const [locale, bundle] of bundles) {
  const missing = [...reference.keys()].filter((key) => !bundle.has(key))
  const extra = [...bundle.keys()].filter((key) => !reference.has(key))
  const empty = [...bundle].filter(([, value]) => typeof value === 'string' && value.trim() === '').map(([key]) => key)
  const unchanged = locale === referenceLocale ? [] : [...reference].filter(([key, value]) =>
    typeof value === 'string' && value.length > 3 && bundle.get(key) === value && !/^(PNYX|Pnyx|IBAN|GPS|NPS|OpenStreetMap|Street View)$/.test(value),
  ).map(([key]) => key)

  console.log(`\n[${locale}] ${bundle.size} leaf values`)
  if (missing.length) console.error(`  missing: ${missing.join(', ')}`)
  if (extra.length) console.warn(`  extra: ${extra.join(', ')}`)
  if (empty.length) console.error(`  empty: ${empty.join(', ')}`)
  if (unchanged.length) console.warn(`  possibly untranslated: ${unchanged.join(', ')}`)
  const missingRequiredStories = requiredStoryKeys.filter((key) => !bundle.has(key))
  const unchangedStories = unchanged.filter((key) => requiredStoryKeys.includes(key))
  if (missingRequiredStories.length) console.error(`  missing required stories: ${missingRequiredStories.join(', ')}`)
  if (unchangedStories.length) console.error(`  untranslated stories: ${unchangedStories.join(', ')}`)
  if (missing.length || empty.length || missingRequiredStories.length || unchangedStories.length) failed = true
}

const sourceFiles = []
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(location)
    else if (/\.[jt]sx?$/.test(entry.name)) sourceFiles.push(location)
  }
}
visit(sourceDirectory)

const usedKeys = new Set()
const hardcoded = []
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/\bt\(\s*['"]([^'"`$]+)['"]/g)) usedKeys.add(match[1])
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    const jsxText = line.match(/>\s*([A-Za-z][^<{]{2,})\s*</)?.[1]
    const attributeText = line.match(/(?:placeholder|aria-label|title|alt)\s*=\s*['"]([A-Za-z][^'"]{2,})['"]/)?.[1]
    if (jsxText || attributeText) hardcoded.push(`${path.relative(root, file)}:${lineIndex + 1} — ${(jsxText ?? attributeText).trim()}`)
  })
}

const unused = [...reference.keys()].filter((key) => !usedKeys.has(key) && ![...usedKeys].some((used) => used.endsWith('.') && key.startsWith(used)))
console.log(`\n[usage] ${unused.length} keys are not statically referenced (dynamic keys may be false positives).`)
if (unused.length) console.log(`  ${unused.join(', ')}`)
console.log(`\n[hardcoded heuristic] ${hardcoded.length} possible user-facing strings (manual review required).`)
if (hardcoded.length) console.log(hardcoded.map((item) => `  ${item}`).join('\n'))

if (failed) {
  console.error('\nTranslation validation failed because missing, empty, or duplicate translations were found.')
  process.exitCode = 1
} else console.log('\nTranslation validation passed.')
