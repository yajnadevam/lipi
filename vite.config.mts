// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import liveReload from 'vite-plugin-live-reload'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { resolve as pathResolve } from 'node:path'
import Sanscript from '@indic-transliteration/sanscript'

// --- MW auto-sync: keeps mw.json in sync with glossing.csv ---
// Reads the same Cologne MW source the offline generator uses
// (dev-tools/ashtadhyayi/generate_explanations.ts), so entries appended here
// are byte-identical to what a full regeneration would produce.
const MW_XML_PATH = pathResolve(__dirname, 'dev-tools/ashtadhyayi/assets/mw.xml')
const MW_JSON_PATH = pathResolve(__dirname, 'src/assets/data/mw.json')
const CSV_PATH = pathResolve(__dirname, 'glossing.csv')

const DEVANAGARI = 'devanagari'
const SLP1 = 'slp1'

// Tag lists and renderBody below are ported verbatim from
// generate_explanations.ts — that file is the source of truth. Keep in sync.
const INVISIBLE_TAGS = [
  'info', 'listinfo', 'hwtype', 'vlex', 'srs', 'shortlong',
  'pb', 'pc', 'pcol', 'lbinfo', 'mark', 'edit', 'root',
  'sic', 'C', 'P', 'H', 'note', 'pic', 'br', 'lb',
]

const TRANSPARENT_TAGS = [
  'ls', 'lex', 'hom', 'lang', 'etym', 'i', 'b', 'gk', 'heb', 'arab',
  'rus', 'mong', 'tib', 'fr', 'ger', 'ed', 'ms', 'lat', 'toch', 'iw',
  'div', 'span', 'bot', 'bio', 'zoo', 'old', 'new', 'chg', 'ns', 'nsi',
  'is', 'cl', 'type', 'per', 'F', 'VN', 'alt', 'sup', 'Poem', 'symbol',
]

function stripTagAndContent (text: string, tag: string): string {
  const selfClose = new RegExp(`<${tag}(\\s[^>]*)?/>`, 'g')
  const paired = new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'g')
  return text.replace(selfClose, '').replace(paired, '')
}

function unwrapTag (text: string, tag: string): string {
  const paired = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g')
  return text.replace(paired, '$1')
}

function renderBody (raw: string): string {
  let body = raw
  for (const tag of INVISIBLE_TAGS) body = stripTagAndContent(body, tag)
  body = body.replace(/<s>([\s\S]*?)<\/s>/g, (_m, content) => {
    const cleaned = content.replace(/<[^>]+>/g, '').replace(/\//g, '')
    return Sanscript.t(cleaned, SLP1, DEVANAGARI)
  })
  body = body.replace(
    /<(ab|s1)\s+n\s*=\s*"([^"]*)"[^>]*>[\s\S]*?<\/\1>/g,
    (_m, _tag, full) => full,
  )
  body = unwrapTag(body, 'ab')
  body = unwrapTag(body, 's1')
  for (const tag of TRANSPARENT_TAGS) body = unwrapTag(body, tag)
  body = body.replace(/<[^>]+>/g, '')
  body = body.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
  return body
}

// Demand-driven, memoized lookup. mw.xml holds 286k entries; indexing all of
// them costs ~600 MB resident, while re-reading the 67 MB file on every sync
// costs ~400 ms per glossing.csv save. Instead, scan only for stems/LIDs we
// haven't resolved yet and cache the outcome — including misses, so the large
// standing set of unresolvable references doesn't trigger a rescan every time.
// Bodies are cached raw and rendered at the point of use; renderBody over the
// whole dictionary would take minutes.
type MwEntry = { lid: string, raw: string }
const mwStemCache = new Map<string, MwEntry[] | null>()
const mwLidCache = new Map<string, { stem: string, raw: string } | null>()

function loadMwEntries (wantStems: Set<string>, wantLids: Set<string>): boolean {
  const stemsToFind = [...wantStems].filter(s => !mwStemCache.has(s))
  const lidsToFind = [...wantLids].filter(l => !mwLidCache.has(l))
  if (stemsToFind.length === 0 && lidsToFind.length === 0) return true

  if (!existsSync(MW_XML_PATH)) {
    console.warn('[mw-sync] MW dictionary not found at', MW_XML_PATH)
    return false
  }
  const pendingStems = new Set(stemsToFind)
  const pendingLids = new Set(lidsToFind)
  console.log(`[mw-sync] Scanning mw.xml (${pendingStems.size} stems, ${pendingLids.size} LIDs)`)

  // Every <H*> entry occupies exactly one line, matching the generator's
  // line-oriented parse.
  const lines = readFileSync(MW_XML_PATH, 'utf8').split('\n')
  for (const line of lines) {
    const keyMatch = line.match(/<key1>(.*?)<\/key1>/)
    if (!keyMatch) continue
    const key1 = keyMatch[1]
    // <H1A> continuation entries use decimal sub-IDs (e.g. 22015.20).
    const linkMatch = line.match(/<L>(\d+(?:\.\d+)?)<\/L>/)
    const lid = linkMatch ? linkMatch[1] : ''
    const wantsStem = pendingStems.has(key1)
    const wantsLid = lid !== '' && pendingLids.has(lid)
    if (!wantsStem && !wantsLid) continue
    const bodyMatch = line.match(/<body>(.*?)<\/body>/)
    if (!bodyMatch) continue
    if (wantsStem) {
      const bucket = mwStemCache.get(key1)
      if (bucket) bucket.push({ lid, raw: bodyMatch[1] })
      else mwStemCache.set(key1, [{ lid, raw: bodyMatch[1] }])
    }
    if (wantsLid) mwLidCache.set(lid, { stem: key1, raw: bodyMatch[1] })
  }

  // Record misses so a subsequent sync doesn't rescan for them.
  for (const s of pendingStems) if (!mwStemCache.has(s)) mwStemCache.set(s, null)
  for (const l of pendingLids) if (!mwLidCache.has(l)) mwLidCache.set(l, null)
  return true
}

function syncMwEntries () {
  const mwJson = JSON.parse(readFileSync(MW_JSON_PATH, 'utf8'))
  const csvRaw = readFileSync(CSV_PATH, 'utf8')
  const rows = parse(csvRaw, { columns: true, relax_quotes: true, relax_column_count: true })

  // Collect all stems and IDs referenced in glossing.csv
  const needed = new Map<string, Set<string>>() // stem → Set of MW IDs
  for (const row of rows) {
    const analysis = (row.analysis || '') as string
    const m = analysis.match(/(?:MW|INDC|PRON)\.([^.\s]+)(?:\.(\d+))?/)
    if (!m) continue
    const stem = m[1]
    const id = m[2]
    if (!needed.has(stem)) needed.set(stem, new Set())
    if (id) needed.get(stem)!.add(id)
  }

  // Find what's missing
  const missingStems = new Set<string>()
  const missingIds = new Map<string, Set<string>>() // stem → missing IDs
  for (const [stem, ids] of needed) {
    const existing = mwJson[stem] as string[] | undefined
    if (!existing || existing.length === 0) {
      missingStems.add(stem)
    } else if (ids.size > 0) {
      for (const id of ids) {
        if (!existing.some((e: string) => e.includes(`[ID=${id}]`))) {
          if (!missingIds.has(stem)) missingIds.set(stem, new Set())
          missingIds.get(stem)!.add(id)
        }
      }
    }
  }

  // Fetch every stem we might touch in a single pass over mw.xml.
  const wantStems = new Set<string>()
  for (const stem of missingStems) wantStems.add(stem.replace(/,$/, ''))
  for (const stem of missingIds.keys()) wantStems.add(stem.replace(/,$/, ''))

  if (!loadMwEntries(wantStems, new Set())) return false

  let added = 0
  // Add entirely missing stems
  for (const stem of missingStems) {
    const cleanStem = stem.replace(/,$/, '')
    const entries = mwStemCache.get(cleanStem)
    if (!entries) {
      console.warn(`[mw-sync] Stem "${cleanStem}" not found in MW dictionary`)
      continue
    }
    mwJson[cleanStem] = entries.map(e => {
      let c = renderBody(e.raw)
      if (e.lid) c += `<L>[ID=${e.lid}]</L>`
      return c
    })
    added += entries.length
    console.log(`[mw-sync] Added stem "${cleanStem}" (${entries.length} entries)`)
  }

  // Add missing IDs to existing stems
  for (const [stem, ids] of missingIds) {
    const cleanStem = stem.replace(/,$/, '')
    const entries = mwStemCache.get(cleanStem)
    if (!entries) continue
    const existing = mwJson[cleanStem] as string[]
    for (const id of ids) {
      const dictEntry = entries.find(e => e.lid === id)
      if (!dictEntry) {
        console.warn(`[mw-sync] ID ${id} for "${cleanStem}" not found in MW dictionary`)
        continue
      }
      let c = renderBody(dictEntry.raw)
      if (dictEntry.lid) c += `<L>[ID=${dictEntry.lid}]</L>`
      existing.push(c)
      added++
      console.log(`[mw-sync] Added ID ${id} to "${cleanStem}"`)
    }
  }

  // Second pass: resolve `id.` (idem) references. Any entry currently in
  // mw.json whose text contains a standalone `id.` defers to the previous MW
  // line. Pull the prior-LID entry into mw.json so validateMeanings can
  // resolve the reference without a dead-end fallback.
  //
  // The prior-LID entry may belong to a different stem (MW's alphabetical
  // ordering typically interleaves morphological variants), so we stash it
  // under a synthetic `@id/<lid>` stem key to avoid colliding with genuine
  // stem entries — the analytics.vue lookup is purely by numeric ID, so the
  // stem key name doesn't matter for validation.
  const existingLids = new Set<string>()
  for (const entries of Object.values(mwJson) as string[][]) {
    for (const e of entries) {
      const m = e.match(/\[ID=(\d+)\]/)
      if (m) existingLids.add(m[1])
    }
  }
  const wantPrevLids = new Set<string>()
  for (const entries of Object.values(mwJson) as string[][]) {
    for (const e of entries) {
      // Strip XML-ish tags before testing — raw entries contain `<ab>id.</ab>,`
      // which would otherwise break the `id.\s*[,;.]` adjacency check.
      const cleaned = e.replace(/<[^>]+>/g, ' ')
      if (!/\bid\.\s*[,;.]/.test(cleaned)) continue
      const m = e.match(/\[ID=(\d+)\]/)
      if (!m) continue
      const prev = String(Number(m[1]) - 1)
      if (!existingLids.has(prev)) wantPrevLids.add(prev)
    }
  }
  if (wantPrevLids.size > 0 && loadMwEntries(new Set(), wantPrevLids)) {
    for (const prevLid of wantPrevLids) {
      const priorEntry = mwLidCache.get(prevLid)
      if (!priorEntry) continue
      const c = renderBody(priorEntry.raw) + `<L>[ID=${prevLid}]</L>`
      mwJson[`@id/${prevLid}`] = [c]
      existingLids.add(prevLid)
      added++
      console.log(`[mw-sync] Added prior-id ${prevLid} (from "${priorEntry.stem}") → @id/${prevLid}`)
    }
  }

  if (added > 0) {
    writeFileSync(MW_JSON_PATH, JSON.stringify(mwJson, null, 2))
    console.log(`[mw-sync] Updated mw.json (+${added} entries)`)
    return true
  }
  return false
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'mw-sync',
      configureServer(server) {
        // Run sync once on startup
        try {
          if (syncMwEntries()) {
            const mwMods = server.moduleGraph.getModulesByFile(MW_JSON_PATH)
            if (mwMods) mwMods.forEach(m => server.moduleGraph.invalidateModule(m))
          }
        } catch (e) {
          console.error('[mw-sync] Initial sync failed:', e)
        }

        // Watch glossing.csv for changes
        server.watcher.on('change', (file) => {
          if (pathResolve(file) !== CSV_PATH) return
          try {
            if (syncMwEntries()) {
              const mwMods = server.moduleGraph.getModulesByFile(MW_JSON_PATH)
              if (mwMods) mwMods.forEach(m => server.moduleGraph.invalidateModule(m))
              console.log('[mw-sync] mw.json cache invalidated')
            }
          } catch (e) {
            console.error('[mw-sync] Sync failed:', e)
          }
        })
      }
    },
    {
      name: 'lemma-editor',
      configureServer(server) {
        const csvPath = pathResolve(__dirname, 'glossing.csv')

        server.middlewares.use('/api/update-lemma', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end()
            return
          }
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { id, idx, field, value } = JSON.parse(body)
              const idStr = String(id)
              const raw = readFileSync(csvPath, 'utf-8')
              const rows = parse(raw, { columns: true, relax_quotes: true, relax_column_count: true })

              // Find the idx-th row with this id
              let count = 0
              for (const row of rows) {
                if (row.id === idStr) {
                  if (count === idx) {
                    row[field] = value
                    break
                  }
                  count++
                }
              }

              // Write back as CSV
              const columns = Object.keys(rows[0])
              const header = columns.join(',')
              const lines = rows.map(row =>
                columns.map(col => {
                  const val = row[col] ?? ''
                  return val.includes(',') || val.includes('"') || val.includes('\n')
                    ? '"' + val.replace(/"/g, '""') + '"'
                    : val
                }).join(',')
              )
              writeFileSync(csvPath, header + '\n' + lines.join('\n') + '\n')

              // Invalidate Vite's transform cache so next page refresh picks up changes
              const mods = server.moduleGraph.getModulesByFile(csvPath)
              if (mods) {
                mods.forEach(m => server.moduleGraph.invalidateModule(m))
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        })
      }
    },
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    liveReload('src/**'),
    Layouts(),
    AutoImport({
      imports: [
        'vue',
        {
          'vue-router/auto': ['useRoute', 'useRouter'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Fonts({
      google: {
        families: [ {
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  assetsInclude: ['**/*.tsv', '**/*.wasm']
})
