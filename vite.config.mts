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
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { resolve as pathResolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'lemma-editor',
      configureServer(server) {
        const csvPath = pathResolve(__dirname, 'ivc-lemma-per-inscription.csv')

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
    watch: {
      ignored: ['**/ivc-lemma-per-inscription.csv'],
    },
  },
  assetsInclude: ['**/*.tsv', '**/*.wasm']
})
