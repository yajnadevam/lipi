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

// --- MW auto-sync: keeps mw.json in sync with glossing.csv ---
const MW_DICT_PATH = '/Users/brr/analysis/mw.txt'
const MW_JSON_PATH = pathResolve(__dirname, 'src/assets/data/mw.json')
const CSV_PATH = pathResolve(__dirname, 'glossing.csv')

let mwDictCache: Record<string, { lid: string, content: string }[]> | null = null
let mwByLidCache: Record<string, { stem: string, content: string }> | null = null

function loadMwDict () {
  if (mwDictCache) return mwDictCache
  if (!existsSync(MW_DICT_PATH)) {
    console.warn('[mw-sync] MW dictionary not found at', MW_DICT_PATH)
    return null
  }
  console.log('[mw-sync] Loading MW dictionary (one-time)...')
  const mwTxt = readFileSync(MW_DICT_PATH, 'utf8')
  const entries = mwTxt.split('<LEND>')
  const dict: Record<string, { lid: string, content: string }[]> = {}
  const byLid: Record<string, { stem: string, content: string }> = {}
  for (const entry of entries) {
    const k1Match = entry.match(/<k1>([^<]+)/)
    if (!k1Match) continue
    const k1 = k1Match[1]
    const lines = entry.trim().split('\n')
    if (lines.length < 2) continue
    const content = lines.slice(1).join('\n').trim()
    const lMatch = lines[0].match(/<L>([^<]+)/)
    const lid = lMatch ? lMatch[1] : ''
    if (!dict[k1]) dict[k1] = []
    dict[k1].push({ lid, content })
    if (lid) byLid[lid] = { stem: k1, content }
  }
  console.log(`[mw-sync] Cached ${Object.keys(dict).length} MW stems, ${Object.keys(byLid).length} LIDs`)
  mwDictCache = dict
  mwByLidCache = byLid
  return dict
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

  const dict = loadMwDict()
  if (!dict) return false

  let added = 0
  // Add entirely missing stems
  for (const stem of missingStems) {
    const cleanStem = stem.replace(/,$/, '')
    if (!dict[cleanStem]) {
      console.warn(`[mw-sync] Stem "${cleanStem}" not found in MW dictionary`)
      continue
    }
    mwJson[cleanStem] = dict[cleanStem].map(e => {
      let c = e.content.replace(/<s>/g, '').replace(/<\/s>/g, '')
      if (e.lid) c += `<L>[ID=${e.lid}]</L>`
      return c
    })
    added += dict[cleanStem].length
    console.log(`[mw-sync] Added stem "${cleanStem}" (${dict[cleanStem].length} entries)`)
  }

  // Add missing IDs to existing stems
  for (const [stem, ids] of missingIds) {
    const cleanStem = stem.replace(/,$/, '')
    if (!dict[cleanStem]) continue
    const existing = mwJson[cleanStem] as string[]
    for (const id of ids) {
      const dictEntry = dict[cleanStem].find(e => e.lid === id)
      if (!dictEntry) {
        console.warn(`[mw-sync] ID ${id} for "${cleanStem}" not found in MW dictionary`)
        continue
      }
      let c = dictEntry.content.replace(/<s>/g, '').replace(/<\/s>/g, '')
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
  const mwByLid = mwByLidCache
  if (mwByLid) {
    const existingLids = new Set<string>()
    for (const entries of Object.values(mwJson) as string[][]) {
      for (const e of entries) {
        const m = e.match(/\[ID=(\d+)\]/)
        if (m) existingLids.add(m[1])
      }
    }
    const idDefers: { lid: string, prevLid: string }[] = []
    for (const entries of Object.values(mwJson) as string[][]) {
      for (const e of entries) {
        // Strip XML-ish tags before testing — raw entries contain `<ab>id.</ab>,`
        // which would otherwise break the `id.\s*[,;.]` adjacency check.
        const cleaned = e.replace(/<[^>]+>/g, ' ')
        if (!/\bid\.\s*[,;.]/.test(cleaned)) continue
        const m = e.match(/\[ID=(\d+)\]/)
        if (!m) continue
        const prev = String(Number(m[1]) - 1)
        if (!existingLids.has(prev)) idDefers.push({ lid: m[1], prevLid: prev })
      }
    }
    for (const { prevLid } of idDefers) {
      const priorEntry = mwByLid[prevLid]
      if (!priorEntry) continue
      let c = priorEntry.content.replace(/<s>/g, '').replace(/<\/s>/g, '')
      c += `<L>[ID=${prevLid}]</L>`
      const bucket = `@id/${prevLid}`
      mwJson[bucket] = [c]
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
