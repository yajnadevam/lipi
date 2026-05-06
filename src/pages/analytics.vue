<template>
  <v-toolbar>
    <v-toolbar-title>Corpus Analytics</v-toolbar-title>
  </v-toolbar>
  <HeaderLinks />

  <v-card>
    <v-layout>
      <v-main>
        <v-container>
          <!-- Loading State -->
          <v-row v-if="!vidyutReady">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h5 text-center">
                  <v-progress-circular indeterminate class="mr-2"></v-progress-circular>
                  Initializing Vidyut...
                </v-card-title>
                <v-card-subtitle class="text-center">
                  Loading Sanskrit validation engine
                </v-card-subtitle>
              </v-card>
            </v-col>
          </v-row>

          <template v-else>
            <!-- Total Words Card -->
            <v-row>
              <v-col cols="12">
                <v-card class="pa-4">
                  <v-card-title class="text-h4 text-center">
                    {{ stats.totalWords }} lemmas
                  </v-card-title>
                  <v-card-subtitle class="text-center">
                    Total lemma entries in the corpus
                  </v-card-subtitle>
                </v-card>
              </v-col>
            </v-row>

            <!-- Pie Chart: Word Type Distribution -->
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card class="pa-4">
                  <v-card-title>Word Type Distribution</v-card-title>
                  <div class="pie-chart-container">
                    <svg viewBox="0 0 200 200" class="pie-chart">
                      <g transform="translate(100, 100)">
                        <path
                          v-for="(slice, idx) in pieSlices"
                          :key="idx"
                          :d="slice.path"
                          :fill="slice.color"
                          :stroke="isDark ? '#1e1e1e' : '#fff'"
                          stroke-width="2"
                          class="pie-slice"
                          @mouseenter="hoveredSlice = idx"
                          @mouseleave="hoveredSlice = null"
                        />
                      </g>
                    </svg>
                    <div class="pie-legend">
                      <div
                        v-for="(slice, idx) in pieSlices"
                        :key="idx"
                        class="legend-item"
                        :class="{ highlighted: hoveredSlice === idx }"
                      >
                        <span class="legend-color" :style="{ backgroundColor: slice.color }"></span>
                        <span class="legend-label">{{ slice.label }}</span>
                        <span class="legend-value">{{ slice.count }} ({{ slice.percent.toFixed(1) }}%)</span>
                      </div>
                    </div>
                  </div>
                </v-card>

                <!-- Zipf Chart: Word Frequency Distribution -->
                <v-card class="pa-4 mt-4">
                  <v-card-title>Word Frequency (Zipf, log–log)</v-card-title>
                  <v-card-subtitle class="zipf-subtitle">
                    {{ zipfChart.totalTokens }} tokens, {{ zipfChart.uniqueWords }} unique
                  </v-card-subtitle>
                  <div class="zipf-stats">
                    <span class="zipf-stat">slope = <b>{{ zipfChart.slope.toFixed(3) }}</b></span>
                    <span class="zipf-stat">R² = <b>{{ zipfChart.r2.toFixed(3) }}</b></span>
                  </div>
                  <div class="zipf-chart-container">
                    <svg :viewBox="`0 0 ${zipfChart.width} ${zipfChart.height}`" class="zipf-chart">
                      <line
                        :x1="zipfChart.padL" :y1="zipfChart.padT"
                        :x2="zipfChart.padL" :y2="zipfChart.height - zipfChart.padB"
                        :stroke="isDark ? '#888' : '#444'" stroke-width="1"
                      />
                      <line
                        :x1="zipfChart.padL" :y1="zipfChart.height - zipfChart.padB"
                        :x2="zipfChart.width - zipfChart.padR" :y2="zipfChart.height - zipfChart.padB"
                        :stroke="isDark ? '#888' : '#444'" stroke-width="1"
                      />
                      <g v-for="t in zipfChart.xTicks" :key="`xt-${t.value}`">
                        <line
                          :x1="t.x" :y1="zipfChart.height - zipfChart.padB"
                          :x2="t.x" :y2="zipfChart.height - zipfChart.padB + 5"
                          :stroke="isDark ? '#888' : '#444'"
                        />
                        <text
                          :x="t.x" :y="zipfChart.height - zipfChart.padB + 18"
                          text-anchor="middle" font-size="11"
                          :fill="isDark ? '#bbb' : '#333'"
                        >{{ t.value }}</text>
                      </g>
                      <g v-for="t in zipfChart.yTicks" :key="`yt-${t.value}`">
                        <line
                          :x1="zipfChart.padL - 5" :y1="t.y"
                          :x2="zipfChart.padL" :y2="t.y"
                          :stroke="isDark ? '#888' : '#444'"
                        />
                        <text
                          :x="zipfChart.padL - 8" :y="t.y + 4"
                          text-anchor="end" font-size="11"
                          :fill="isDark ? '#bbb' : '#333'"
                        >{{ t.value }}</text>
                      </g>
                      <text
                        :x="zipfChart.padL + (zipfChart.width - zipfChart.padL - zipfChart.padR) / 2"
                        :y="zipfChart.height - 8"
                        text-anchor="middle" font-size="12"
                        :fill="isDark ? '#bbb' : '#333'"
                      >rank</text>
                      <text
                        :x="14"
                        :y="zipfChart.padT + (zipfChart.height - zipfChart.padT - zipfChart.padB) / 2"
                        text-anchor="middle" font-size="12"
                        :fill="isDark ? '#bbb' : '#333'"
                        :transform="`rotate(-90 14 ${zipfChart.padT + (zipfChart.height - zipfChart.padT - zipfChart.padB) / 2})`"
                      >frequency</text>
                      <line
                        :x1="zipfChart.refLine.x1" :y1="zipfChart.refLine.y1"
                        :x2="zipfChart.refLine.x2" :y2="zipfChart.refLine.y2"
                        :stroke="isDark ? '#666' : '#999'"
                        stroke-width="1" stroke-dasharray="4 4"
                      />
                      <line
                        :x1="zipfChart.fitLine.x1" :y1="zipfChart.fitLine.y1"
                        :x2="zipfChart.fitLine.x2" :y2="zipfChart.fitLine.y2"
                        :stroke="isDark ? '#FF8A65' : '#D84315'"
                        stroke-width="1.5"
                      />
                      <polyline
                        :points="zipfChart.points"
                        fill="none"
                        :stroke="isDark ? '#64B5F6' : '#1976D2'"
                        stroke-width="1.5"
                      />
                      <g v-for="lbl in zipfChart.topLabels" :key="`tl-${lbl.word}`">
                        <circle :cx="lbl.x" :cy="lbl.y" r="3" :fill="isDark ? '#64B5F6' : '#1976D2'" />
                        <text
                          :x="lbl.x + 6" :y="lbl.y - 4"
                          font-size="11"
                          :fill="isDark ? '#ddd' : '#222'"
                        >{{ lbl.word }} ({{ lbl.freq }})</text>
                      </g>
                    </svg>
                  </div>
                </v-card>
              </v-col>

              <!-- Validation Bars -->
              <v-col cols="12" md="6">
                <v-card class="pa-4">
                  <v-card-title>Validation Status</v-card-title>
                  <div class="validation-bars">
                    <!-- Stems Validation -->
                    <div class="validation-row" @click="toggleInvalid('stems')">
                      <div class="validation-label">Valid MW Stems ({{ stats.totalStemsCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validStemsPercent + '%' }"
                        >
                          {{ stats.validStemsCount }} ({{ stats.validStemsPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validStemsPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validStemsPercent) + '%' }"
                        >
                          {{ stats.invalidStemsCount }} ({{ (100 - stats.validStemsPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Derived Stems Validation (Vidyut) -->
                    <div class="validation-row" @click="toggleInvalid('derivedStems')">
                      <div class="validation-label">Valid Krdanta/Taddhita Derivations ({{ stats.totalDerivedStemsCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validDerivedStemsPercent + '%' }"
                        >
                          {{ stats.validDerivedStemsCount }} ({{ stats.validDerivedStemsPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validDerivedStemsPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validDerivedStemsPercent) + '%' }"
                        >
                          {{ stats.invalidDerivedStemsCount }} ({{ (100 - stats.validDerivedStemsPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Declensions Validation -->
                    <div class="validation-row" @click="toggleInvalid('declensions')">
                      <div class="validation-label">Valid Declensions ({{ stats.totalDeclensionsCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validDeclensionsPercent + '%' }"
                        >
                          {{ stats.validDeclensionsCount }} ({{ stats.validDeclensionsPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validDeclensionsPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validDeclensionsPercent) + '%' }"
                        >
                          {{ stats.invalidDeclensionsCount }} ({{ (100 - stats.validDeclensionsPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- TIN (Verb Conjugation) Validation -->
                    <div class="validation-row" @click="toggleInvalid('tin')">
                      <div class="validation-label">Valid TIN ({{ stats.totalTinCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validTinPercent + '%' }"
                        >
                          {{ stats.validTinCount }} ({{ stats.validTinPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validTinPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validTinPercent) + '%' }"
                        >
                          {{ stats.invalidTinCount }} ({{ (100 - stats.validTinPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Meanings Validation -->
                    <div class="validation-row" @click="toggleInvalid('meanings')">
                      <div class="validation-label">Valid Meanings ({{ stats.totalMeaningsCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validMeaningsPercent + '%' }"
                        >
                          {{ stats.validMeaningsCount }} ({{ stats.validMeaningsPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validMeaningsPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validMeaningsPercent) + '%' }"
                        >
                          {{ stats.invalidMeaningsCount }} ({{ (100 - stats.validMeaningsPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Word Coverage Validation -->
                    <div class="validation-row" @click="toggleInvalid('coverage')">
                      <div class="validation-label">Word Coverage ({{ stats.totalCoverageCount }} inscriptions)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validCoveragePercent + '%' }"
                        >
                          {{ stats.validCoverageCount }} ({{ stats.validCoveragePercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validCoveragePercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validCoveragePercent) + '%' }"
                        >
                          {{ stats.invalidCoverageCount }} ({{ (100 - stats.validCoveragePercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Syntactic Agreement Validation -->
                    <div class="validation-row" @click="toggleInvalid('agreement')">
                      <div class="validation-label">Syntactic Agreement ({{ stats.totalAgreementCount }} multi-word inscriptions)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validAgreementPercent + '%' }"
                        >
                          {{ stats.validAgreementCount }} ({{ stats.validAgreementPercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validAgreementPercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validAgreementPercent) + '%' }"
                        >
                          {{ stats.invalidAgreementCount }} ({{ (100 - stats.validAgreementPercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>

                    <!-- Lexeme in Translation Validation -->
                    <div class="validation-row" @click="toggleInvalid('lexemes')">
                      <div class="validation-label">Lexeme in Translation ({{ stats.totalLexemeCount }} checked)</div>
                      <div class="validation-bar-container">
                        <div
                          class="validation-bar valid"
                          :style="{ width: stats.validLexemePercent + '%' }"
                        >
                          {{ stats.validLexemeCount }} ({{ stats.validLexemePercent.toFixed(1) }}%)
                        </div>
                        <div
                          v-if="stats.validLexemePercent < 100"
                          class="validation-bar invalid"
                          :style="{ width: (100 - stats.validLexemePercent) + '%' }"
                        >
                          {{ stats.invalidLexemeCount }} ({{ (100 - stats.validLexemePercent).toFixed(1) }}%)
                        </div>
                      </div>
                    </div>
                  </div>
                  <v-card-text class="text-caption text-center mt-2">
                    Click any bar to see invalid entries
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Invalid Entries Dialog -->
            <v-dialog v-model="showInvalidDialog" max-width="900">
              <v-card>
                <v-card-title class="d-flex justify-space-between align-center">
                  <span>Invalid {{ invalidType }} ({{ invalidEntries.length }} entries, {{ uniqueInvalidCount }} unique)</span>
                  <v-btn icon @click="showInvalidDialog = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-card-title>
                <v-divider />
                <v-card-text style="max-height: 500px; overflow-y: auto;">
                  <v-data-table
                    :headers="invalidTableHeaders"
                    :items="invalidEntries"
                    :items-per-page="50"
                    density="compact"
                    class="invalid-entries-table"
                    item-value="_key"
                  >
                    <template #[`item.analysis`]="{ item }">
                      <span class="text-caption">{{ item.analysis }}</span>
                    </template>
                    <template #[`item.issue`]="{ item }">
                      <span class="text-caption text-error">{{ item.issue }}</span>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-dialog>
          </template>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script>
  import { ref, computed, onMounted } from 'vue'
  import { useTheme } from 'vuetify'
  import { csv2json } from 'json-2-csv'
  import lemmasCsv from '../../glossing.csv?raw'
  import inscriptionsCsv from '../assets/data/inscriptions.csv?raw'
  import mwJson from '../assets/data/mw.json'
  import lexicons from '../assets/data/lexicons.json'
  import dhatuJson from '../assets/data/dhatu.json'
  import synonymGroups from '../assets/data/synonym_groups.json'
  import initVidyut, { Vidyut } from '../vidyut/vidyut_prakriya.js'
  import dhatupatha from '../assets/vidyut/vidyut_dhatupatha_5.tsv'
  import { buildDhatuIndex, derive } from '@/scripts/vidyut-derive'
  import Sanscript from '@indic-transliteration/sanscript'

  // Parse lemmas data (lazy init to catch errors)
  let lemmas = []
  let inscriptions = []
  let mwIndex = new Set()
  // Per-source stem indexes built from lexicons.json (e.g. lexiconIndex.Apte).
  const lexiconIndex = {}
  let initError = null

  try {
    // Convert CRLF to LF - json-2-csv doesn't handle CRLF properly
    const allInscriptions = csv2json(inscriptionsCsv.replace(/\r\n/g, '\n'))
    const excludedIds = new Set()
    for (const row of allInscriptions) {
      const text = (row.text || '').trim()
      if (!text) continue
      if (text.includes('[') || text.includes(']') || text.includes('000')) {
        excludedIds.add(row.id)
      }
    }
    inscriptions = allInscriptions.filter(row => !excludedIds.has(row.id))
    lemmas = csv2json(lemmasCsv.replace(/\r\n/g, '\n'))
      .filter(row => !excludedIds.has(row.id))
    mwIndex = new Set(Object.keys(mwJson))
    for (const [stem, entries] of Object.entries(lexicons)) {
      for (const entry of entries) {
        if (!lexiconIndex[entry.source]) lexiconIndex[entry.source] = new Set()
        lexiconIndex[entry.source].add(stem)
      }
    }
  } catch (e) {
    console.error('Failed to initialize data:', e)
    initError = e.message
  }

  function extractMeaning(lexeme) {
    if (!lexeme) return null
    const cleaned = lexeme.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim()
    const match = cleaned.match(/^([^/]+)/)
    return match ? match[1].trim() : cleaned
  }

  // Each row starts with the MW dictionary phrase (where applicable);
  // the remaining entries are synonyms that may appear in English translations.
  // A word may belong to multiple rows — the map stores all groups per key.
  const synonymMap = new Map()
  for (const group of synonymGroups) {
    for (const word of group) {
      const key = word.toLowerCase()
      const existing = synonymMap.get(key)
      if (existing) existing.push(group)
      else synonymMap.set(key, [group])
    }
  }

  function stemWord(word) {
    for (const suf of ['able', 'ness', 'ment', 'tion', 'sion', 'ful', 'ous', 'ive', 'ing', 'er', 'ed', 'ly', 'al', 'ity']) {
      if (word.endsWith(suf) && word.length > suf.length + 2) {
        return word.slice(0, -suf.length)
      }
    }
    if (word.endsWith('s') && word.length > 4) return word.slice(0, -1)
    return word
  }

  function meaningInDictionary(lexemeMeaning, dictMeaning) {
    if (!lexemeMeaning || !dictMeaning) return true

    const lexLower = lexemeMeaning.toLowerCase()
    const dictLower = dictMeaning.replace(/<[^>]+>/g, ' ').toLowerCase()
    // Raw dictionary text (XML stripped but case preserved) for Devanagari matching
    const dictRaw = dictMeaning.replace(/<[^>]+>/g, '')

    if (dictLower.includes(lexLower)) return true

    // Full-phrase synonym lookup. Per-word synonym checks below can't reach
    // multi-word keys like "at the end", since lexWords splits on whitespace.
    const phraseGroups = synonymMap.get(lexLower)
    if (phraseGroups) {
      for (const group of phraseGroups) {
        for (const syn of group) if (dictLower.includes(syn.toLowerCase())) return true
      }
    }

    // IAST transliterated terms (e.g. "Prāṇa") → check Devanagari in dictionary
    const iastRe = /[āīūṛṝḷḹṃḥñṅṇṭḍśṣ]/i
    if (iastRe.test(lexemeMeaning)) {
      try {
        const deva = Sanscript.t(lexemeMeaning.toLowerCase(), 'iast', 'devanagari')
        if (dictRaw.includes(deva)) return true
      } catch (_) { /* ignore transliteration errors */ }
    }

    const lexWords = lexLower.split(/[\s,;.]+/).filter(w => w.length > 2)
    const dictWords = dictLower.split(/[\s,;.'()+]+/).filter(w => w.length >= 3)

    for (const word of lexWords) {
      if (dictLower.includes(word)) return true
      // 4-char prefix substring
      if (word.length >= 4 && dictLower.includes(word.slice(0, 4))) return true
      // 3-char prefix word-level match
      if (dictWords.some(dw => dw.startsWith(word.slice(0, 3)))) return true
      // Negation prefix: "unborn" ↔ "not born", "immortal" ↔ "not mortal"
      const negPrefixes = [
        { pre: 'un', base: w => w.slice(2) },
        { pre: 'im', base: w => w.slice(2) },
        { pre: 'in', base: w => w.slice(2) },
        { pre: 'ir', base: w => w.slice(2) },
        { pre: 'il', base: w => w.slice(2) },
        { pre: 'non', base: w => w.slice(3) },
      ]
      for (const { pre, base } of negPrefixes) {
        if (word.startsWith(pre) && word.length > pre.length + 2) {
          const root = base(word)
          if (dictLower.includes('not ' + root) || dictLower.includes('not ' + stemWord(root))) return true
          // Also match dictionary "un"/"in"/etc. variants
          if (dictLower.includes(word)) return true
        }
      }
      // Stemmed match: "roarer" → "roar", "powerful" → "power"
      const stem = stemWord(word)
      if (stem !== word && stem.length >= 3 && dictLower.includes(stem)) return true
      // Synonym check — a word may belong to multiple groups, so check each.
      const groups = synonymMap.get(word) || synonymMap.get(stem)
      if (groups) {
        for (const group of groups) {
          for (const syn of group) {
            if (dictLower.includes(syn.toLowerCase())) return true
          }
        }
      }
    }

    return false
  }

  function computeZipf (inscriptionRows) {
    // Keys are stringified — csv2json parses numeric ids like 2.1 as JS numbers,
    // but `ref:1.1` carries the target as a string, so Map lookups would miss.
    const sanskritById = new Map()
    for (const insc of inscriptionRows) {
      if (insc.id != null) sanskritById.set(String(insc.id), (insc.sanskrit || '').trim())
    }

    // Resolve ref:X.Y indirection. Each reference counts independently —
    // if 23.1 and 405.1 both ref:11.1, the words of 11.1 are tallied twice.
    function resolve (id, seen = new Set()) {
      const key = String(id)
      if (seen.has(key)) return ''
      seen.add(key)
      const sk = sanskritById.get(key) || ''
      if (sk.startsWith('ref:')) return resolve(sk.slice(4).trim(), seen)
      return sk
    }

    const counts = new Map()
    for (const insc of inscriptionRows) {
      const sk = resolve(insc.id)
      if (!sk) continue
      for (const raw of sk.split(/[\s\-_]+/)) {
        if (!raw) continue
        // Strip word-final visarga (H) and anusvāra (M) — sandhi-conditioned
        // endings that don't change the underlying lexeme.
        const w = raw.replace(/[HM]$/, '')
        if (!w) continue
        counts.set(w, (counts.get(w) || 0) + 1)
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word, freq], i) => ({ word, freq, rank: i + 1 }))
  }

  // Vidyut instance (set after initialization)
  let vidyut = null

  // Dhatu lookup index: maps simplified form (e.g., "Sad") to aupadeshika (e.g., "za\\dx~")
  let dhatuIndex = null

  function classifyTypes (rows) {
    let mwCount = 0
    let dhatuKrtCount = 0
    let tinCount = 0
    let userCount = 0
    for (const row of rows) {
      const analysis = row.analysis || ''
      if (analysis.startsWith('MW.') || analysis.startsWith('INDC.') || analysis.startsWith('PRON.') || analysis.startsWith('Apte.')) {
        mwCount++
      } else if (analysis.startsWith('DHATU.')) {
        if (analysis.includes('KRT.')) {
          dhatuKrtCount++
        } else if (analysis.includes('TIN.')) {
          tinCount++
        }
      } else if (analysis.startsWith('USER')) {
        userCount++
      }
    }
    return { mwCount, dhatuKrtCount, tinCount, userCount }
  }

  function validateStems (rows) {
    let valid = 0
    let invalid = 0
    for (const row of rows) {
      const analysis = row.analysis || ''
      const apteMatch = analysis.match(/\bApte\.([^.\s]+)/)
      if (apteMatch) {
        if (lexiconIndex.Apte && lexiconIndex.Apte.has(apteMatch[1])) valid++
        else invalid++
        continue
      }
      const mwMatch = analysis.match(/\bMW\.([^.\s]+)/)
      if (mwMatch) {
        if (mwIndex.has(mwMatch[1])) {
          valid++
        } else {
          invalid++
        }
        continue
      }
      // USER.<stem> entries are user-supplied lexemes not yet in any dictionary;
      // count them as invalid stems so they surface in the Valid MW Stems bar.
      if (/\bUSER\.[^.\s]+/.test(analysis)) invalid++
    }
    return { valid, invalid }
  }

  function validateDerivations (rows) {
    let validDerived = 0
    let invalidDerived = 0
    let validDecl = 0
    let invalidDecl = 0
    let validTin = 0
    let invalidTin = 0
    const invalidDerivedList = []
    const invalidDeclList = []
    const invalidTinList = []
    const derivablePattern = /\bDHATU\.|\b(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.[MFN]\.[SDP]\b/

    for (const row of rows) {
      const analysis = (row.analysis || '').replace(/^USER\|/, '')
      const form = row.form || ''
      const hasDhatu = analysis.startsWith('DHATU.')
      const hasKrt = analysis.includes('KRT.')
      const hasTin = analysis.includes('TIN.')
      const hasTad = analysis.includes('TAD.')
      const mwMatch = analysis.match(/MW\.([^.\s]+)/)
      const isDerivable = analysis && form && derivablePattern.test(analysis)
      const caseMatch = analysis.match(/\b(Nom|Voc|Acc|Ins|Dat|Abl|Gen|Loc)\.(M|F|N)\.(S|D|P)\b/)

      if (isDerivable) {
        let result = null
        try {
          result = derive(vidyut, analysis, form, { dhatuIndex })
        } catch (_) { /* derivation error */ }

        if (hasDhatu && hasKrt) {
          if (result?.match) {
            validDerived++
          } else {
            invalidDerived++
            invalidDerivedList.push({ ...row, issue: result ? `got "${result.text}"` : 'no derivation' })
          }
        } else if (hasDhatu && hasTin) {
          if (result?.match) {
            validTin++
          } else {
            invalidTin++
            invalidTinList.push({ ...row, issue: `vidyut: got "${result?.text || 'no derivation'}"` })
          }
        } else if (caseMatch) {
          if (result?.match) {
            validDecl++
          } else {
            invalidDecl++
            invalidDeclList.push({ ...row, issue: `vidyut: got "${result?.text || 'no derivation'}"` })
          }
        }
      } else if (mwMatch && hasTad && !caseMatch) {
        // Try vidyut derivation for MW + TAD entries
        let result = null
        try {
          result = derive(vidyut, analysis, form, { dhatuIndex })
        } catch (_) { /* derivation error */ }
        if (result?.match) {
          validDerived++
        } else {
          invalidDerived++
          invalidDerivedList.push({ ...row, issue: result ? `got "${result.text}"` : (mwIndex.has(mwMatch[1]) ? 'vidyut cannot derive taddhita' : `MW stem "${mwMatch[1]}" not in dictionary`) })
        }
      }
    }
    return { validDerived, invalidDerived, validDecl, invalidDecl, validTin, invalidTin, invalidDerivedList, invalidDeclList, invalidTinList }
  }

  function normalizeSibilants (str) {
    return str.replace(/[sSzhH]/g, 's').replace(/M/g, 'm')
  }

  // Test B from the agreement scoping: within each Case-group of an inscription's
  // case-marked words, all members must share Gender+Number. Sanskrit allows
  // different cases to coexist in one phrase (subject + object, head + possessor),
  // but words sharing a case are typically coordinated or modifier-head and must agree.
  function validateAgreement (glossingRows) {
    const cgnRe = /\b(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.([MFN])\.([SDP])\b/
    const byId = new Map()
    for (const r of glossingRows) {
      if (r.type !== 'word') continue
      const m = (r.analysis || '').match(cgnRe)
      if (!m) continue
      const id = String(r.id)
      if (!byId.has(id)) byId.set(id, [])
      byId.get(id).push({ form: r.form, analysis: r.analysis, case: m[1], gn: `${m[2]}.${m[3]}`, cgn: m[0] })
    }

    let valid = 0
    let invalid = 0
    const invalidList = []
    for (const [id, words] of byId) {
      if (words.length < 2) continue
      const byCase = new Map()
      for (const w of words) {
        if (!byCase.has(w.case)) byCase.set(w.case, [])
        byCase.get(w.case).push(w)
      }
      let conflictCase = null
      let conflictWords = null
      for (const [c, wlist] of byCase) {
        const gns = new Set(wlist.map(w => w.gn))
        if (gns.size > 1) { conflictCase = c; conflictWords = wlist; break }
      }
      if (conflictCase) {
        invalid++
        invalidList.push({
          id,
          form: words.map(w => w.form).join(' '),
          analysis: words.map(w => w.cgn).join(', '),
          issue: `case "${conflictCase}" mixes ${conflictWords.map(w => `${w.form}(${w.gn})`).join(' / ')}`,
        })
      } else {
        valid++
      }
    }
    return { valid, invalid, invalidList }
  }

  function validateCoverage (glossingRows, inscriptionRows) {
    // Build glossing index: id → Set of forms (both original and normalized)
    const glossingById = new Map()
    const glossingLexemes = new Map() // id → [{form, lexeme}]
    for (const row of glossingRows) {
      const id = row.id
      if (!id) continue
      if (!glossingById.has(id)) glossingById.set(id, new Set())
      glossingById.get(id).add(row.form || '')
      glossingById.get(id).add(normalizeSibilants(row.form || ''))
      if (!glossingLexemes.has(id)) glossingLexemes.set(id, [])
      const lex = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
      if (lex) glossingLexemes.get(id).push({ form: row.form, lexeme: lex, analysis: row.analysis || '' })
    }

    let validCoverage = 0
    let invalidCoverage = 0
    const invalidCoverageList = []
    let validLexeme = 0
    let invalidLexeme = 0
    const invalidLexemeList = []

    // Standalone upasarga particles (in SLP1). When a row's form is one of
    // these and the analysis cites it as MW.<form>.<id>, skip the
    // lex-in-translation check — upasargas don't have an independent English
    // realization; their force is absorbed into the verb they modify, so
    // requiring the gloss (e.g. "fully" for आ) to appear in the translation
    // is linguistically incorrect.
    const UPASARGAS = new Set([
      'pra', 'parA', 'apa', 'sam', 'anu', 'ava', 'nis', 'nir', 'dus', 'dur',
      'vi', 'A', 'ni', 'aDi', 'api', 'ati', 'su', 'ud', 'aBi', 'prati',
      'pari', 'upa', 'sa',
    ])

    for (const insc of inscriptionRows) {
      const id = insc.id
      const sanskrit = (insc.sanskrit || '').trim()
      const translation = (insc.translation || '').trim()

      // Skip empty, ref:, or untranslated inscriptions
      if (!sanskrit || sanskrit.startsWith('ref:') || !translation) continue

      // --- Word Coverage: every word/compound member has a glossing entry ---
      const glossForms = glossingById.get(id)
      const words = sanskrit.split(/\s+/)
      const allMembers = []
      for (const word of words) {
        for (const member of word.split('-')) {
          if (member) allMembers.push(member)
        }
      }

      if (!glossForms || glossForms.size === 0) {
        invalidCoverage++
        invalidCoverageList.push({ id, form: sanskrit, analysis: '', issue: 'No glossing entries for this inscription' })
      } else {
        const missing = allMembers.filter(m => !glossForms.has(m) && !glossForms.has(normalizeSibilants(m)))
        if (missing.length === 0) {
          validCoverage++
        } else {
          invalidCoverage++
          invalidCoverageList.push({ id, form: sanskrit, analysis: '', issue: `Missing glossing: ${missing.join(', ')}` })
        }
      }

      // --- Lexeme-in-Translation: each lexeme appears in the inscription translation ---
      const lexemes = glossingLexemes.get(id) || []
      for (const { form, lexeme, analysis } of lexemes) {
        const meaning = extractMeaning(lexeme)
        if (!meaning || meaning.length < 2) continue
        // Skip standalone upasargas — their meaning is absorbed into the verb.
        const cleanAnalysis = (analysis || '').replace(/^USER\|/, '')
        if (UPASARGAS.has(form) && new RegExp(`^MW\\.${form}\\.`).test(cleanAnalysis)) continue
        // Strip bracketed refs from translation for matching
        const cleanTranslation = translation.replace(/\[[^\]]*\]/g, ' ')
        if (meaningInDictionary(meaning, cleanTranslation)) {
          validLexeme++
        } else {
          invalidLexeme++
          invalidLexemeList.push({ id, form, analysis: lexeme, issue: `"${meaning}" not found in: "${cleanTranslation.substring(0, 80).trim()}…"` })
        }
      }
    }

    return {
      validCoverage,
      invalidCoverage,
      invalidCoverageList,
      validLexeme,
      invalidLexeme,
      invalidLexemeList,
    }
  }

  function validateMeanings (rows) {
    let valid = 0
    let invalid = 0
    const invalidList = []

    // Build an ID → entry index so we can follow `id.` (idem) cross-references
    // to the previous MW entry by numeric ID.
    const mwById = new Map()
    for (const entries of Object.values(mwJson)) {
      for (const e of entries) {
        const m = e.match(/\[ID=(\d+)\]/)
        if (m) mwById.set(Number(m[1]), e)
      }
    }

    for (const row of rows) {
      const analysis = (row.analysis || '').replace(/^USER\|/, '')
      // Skip PRON entries — MW doesn't gloss pronoun lemmas with English;
      // form correctness is already validated by vidyut in validateDerivations
      if (analysis.startsWith('PRON.')) continue

      // DHATU meaning validation is temporarily disabled — flip
      // DHATU_VALIDATION_ENABLED to true to re-enable. All lookup logic below
      // is retained so nothing needs to be re-derived when we switch it back on.
      const DHATU_VALIDATION_ENABLED = true
      if (analysis.startsWith('DHATU.') && !DHATU_VALIDATION_ENABLED) continue

      // DHATU entries: validate against dhatu.json (composed dhātu meanings)
      // rather than MW (which doesn't gloss verbal roots in English).
      if (analysis.startsWith('DHATU.')) {
        const dhatuTok = analysis.substring(6).split(/\s+/)[0]
        // Strip upasargas (everything before the last '-' segment)
        const segs = dhatuTok.split('-')
        const rootGana = segs[segs.length - 1]
        const lastDot = rootGana.lastIndexOf('.')
        const root = lastDot === -1 ? rootGana : rootGana.substring(0, lastDot)
        const gana = lastDot === -1 ? '' : rootGana.substring(lastDot + 1)
        const dhatuMeanings = (gana && dhatuJson[`${root}.${gana}`]) || dhatuJson[root]
        if (!dhatuMeanings) continue // unknown dhātu — skip rather than flag
        const lexeme = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
        if (!lexeme) continue
        const meaning = extractMeaning(lexeme)
        if (!meaning || meaning.length < 2) continue
        // Strip "to " prefixes from dhātu glosses to avoid spurious matches
        const dhatuText = dhatuMeanings.replace(/\bto\s+/g, '')
        if (meaningInDictionary(meaning, dhatuText)) {
          valid++
          continue
        }
        // Fallback: if the analysis also carries an MW citation, accept the
        // row when the cited MW entry covers the lexeme. Translators sometimes
        // pick a krt-derivative sense that's recorded in MW under the root but
        // isn't part of dhatu.json's terse gloss (e.g. Kanu~ "dig"
        // → MW.Kan.61265 "pierce"). Citations may be either MW.<stem>.<id>
        // or MW.<id> (id-only) — handle both.
        let dhatuMwDef = null
        const mwCite = analysis.match(/\bMW\.([^.\s]+)\.(\d+(?:\.\d+)?)/)
        if (mwCite) {
          const entries = mwJson[mwCite[1]]
          dhatuMwDef = entries && entries.find(e => e.includes(`[ID=${mwCite[2]}]`))
        } else {
          const idOnly = analysis.match(/\bMW\.(\d+(?:\.\d+)?)\b/)
          if (idOnly) dhatuMwDef = mwById.get(Number(idOnly[1]))
        }
        if (dhatuMwDef && meaningInDictionary(meaning, dhatuMwDef)) {
          valid++
          continue
        }
        // Apte citation fallback. DHATU rows often carry Apte.<stem> for the
        // krdanta sense — if that stem has a matching gloss in lexicons.json,
        // accept the row.
        const apteCite = analysis.match(/\bApte\.([^.\s]+)/)
        if (apteCite) {
          const apteGlosses = (lexicons[apteCite[1]] || []).filter(e => e.source === 'Apte').map(e => e.gloss.toLowerCase())
          if (apteGlosses.includes(meaning.toLowerCase())) {
            valid++
            continue
          }
        }
        invalid++
        invalidList.push({ ...row, issue: `"${lexeme}" not in dhātu glosses: "${dhatuText.substring(0, 80).trim()}…"` })
        continue
      }

      // Apte entries validate against lexicons.json filtered by source.
      // The translation_lexeme must match one of the stored glosses directly.
      const apteMatch = analysis.match(/\bApte\.([^.\s]+)/)
      if (apteMatch) {
        const apteStem = apteMatch[1]
        const glosses = (lexicons[apteStem] || []).filter(e => e.source === 'Apte').map(e => e.gloss)
        const lexeme = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
        if (glosses.length === 0) {
          invalid++
          invalidList.push({ ...row, issue: `"${apteStem}" not in lexicons.json (Apte)` })
          continue
        }
        if (!lexeme) {
          invalid++
          invalidList.push({ ...row, issue: 'Missing translation_lexeme' })
          continue
        }
        const meaning = extractMeaning(lexeme) || lexeme
        const lc = meaning.toLowerCase()
        if (glosses.some(g => g.toLowerCase() === lc)) {
          valid++
        } else {
          invalid++
          invalidList.push({ ...row, issue: `"${lexeme}" not in Apte glosses: ${glosses.join(', ')}` })
        }
        continue
      }

      // Extract stem and MW ID from analysis: MW.stem.id, PRON.stem.id, INDC.stem.id
      // ID may be an integer (22015) or a decimal sub-ID (22015.20) referencing
      // a CDSL <H1A> continuation entry.
      const mwMatch = analysis.match(/(?:MW|INDC|PRON)\.([^.\s]+)(?:\.(\d+(?:\.\d+)?))?/)
      if (!mwMatch) continue

      const stem = mwMatch[1]
      const mwId = mwMatch[2]
      const allEntries = mwJson[stem]
      if (!allEntries || allEntries.length === 0) continue

      const lexeme = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
      if (!lexeme) {
        invalid++
        invalidList.push({ ...row, issue: 'Missing translation_lexeme' })
        continue
      }

      const meaning = extractMeaning(lexeme)
      if (!meaning || meaning.length < 2) continue

      // If the lexeme is the word itself (used as-is in translation), it's valid
      // Compare in both IAST and SLP1 since meanings may use either
      const meaningLower = meaning.toLowerCase()
      const meaningSlp1 = Sanscript.t(meaningLower, 'iast', 'slp1')
      if (meaningLower === (row.form || '').toLowerCase() || meaningLower === stem.toLowerCase() ||
          meaningSlp1 === (row.form || '') || meaningSlp1 === stem) {
        valid++
        continue
      }

      // Try the specific MW ID first, then fall back to all entries for the stem
      let dictDef = null
      if (mwId) {
        dictDef = allEntries.find(e => e.includes(`[ID=${mwId}]`))
      }

      // For NEG entries, also try matching the base meaning (strip negation prefix)
      // or accept double-negation cases where the dictionary already has a negation
      const hasNeg = /\bNEG\b/.test(analysis)
      let baseMeaning = meaning
      if (hasNeg) {
        // Strip "not " / "non-" phrase prefix
        if (meaning.toLowerCase().startsWith('not ')) {
          baseMeaning = meaning.substring(4)
        } else if (meaning.toLowerCase().startsWith('non-')) {
          baseMeaning = meaning.substring(4)
        } else {
          // Strip English negation prefixes (un-, in-, im-, etc.)
          const negPrefixes = ['un', 'in', 'im', 'ir', 'il']
          for (const pre of negPrefixes) {
            if (meaning.toLowerCase().startsWith(pre) && meaning.length > pre.length + 2) {
              baseMeaning = meaning.substring(pre.length)
              break
            }
          }
        }
      }

      // Follow cross-references. Use precise MW idioms — the bare word "for"
      // matches too many non-references ("used for the loc.", "for kindling")
      // so it's omitted in favour of the abbreviated forms MW actually uses to
      // signal a pointer ("in comp. for X", "ifc. for X", "w.r. for X",
      // "metrically for X", "formed to explain X"), plus "See X" and "= X".
      let seeEntries = null
      let seeDeadEnd = false
      const dictText = (dictDef || allEntries[0] || '').replace(/<[^>]+>/g, ' ')
      let seeTarget = dictText.match(
        /(?:See|=|in\s+comp\.\s+for|ifc\.\s+for|w\.r\.\s+for|metrically\s+for|formed\s+to\s+explain)\s+\d*\.?\s*(\S+)/,
      )
      // Also follow "(in comp. -X)" — MW's bare-hyphen pointer form, e.g.
      // ara → "(in comp. -अरम्)" which sends the reader to the अरम् entry.
      if (!seeTarget) seeTarget = dictText.match(/\(\s*in\s+comp\.\s+-([^\s)]+)\)/)
      if (seeTarget) {
        let target = seeTarget[1].replace(/[\/.,;)]+$/, '').replace(/-/g, '')
        // Generator transliterates <s>X</s> to Devanagari when rendering the
        // body, so cross-reference targets typically arrive in Devanagari
        // (e.g. "in comp. for सत्"). mwJson is keyed by SLP1, so transliterate
        // back before lookup.
        if (/[\u0900-\u097F]/.test(target)) {
          try { target = Sanscript.t(target, 'devanagari', 'slp1') } catch (_) { /* keep raw */ }
        }
        if (mwJson[target]) {
          seeEntries = mwJson[target]
        } else {
          seeDeadEnd = true // reference target missing from dictionary
        }
      }

      // Follow `id.` (idem) references — entry defers to the previous MW line.
      // Find the entry with ID = (current ID - 1) in our ID index. If we can't
      // find it locally, let the row fall through to normal flagging rather
      // than silently dead-ending — the mw-sync plugin should pull prior-id
      // entries in on dev server restart; a persistent miss here is a real
      // data bug the user needs to see, not a dead end to paper over.
      if (!seeEntries && /\bid\.\s*[,;.]/.test(dictText)) {
        const idMatch = (dictDef || '').match(/\[ID=(\d+)\]/)
        if (idMatch) {
          const prevEntry = mwById.get(Number(idMatch[1]) - 1)
          if (prevEntry) seeEntries = [prevEntry]
        }
      }

      let matched = false
      if (dictDef) {
        matched = meaningInDictionary(meaning, dictDef) || (hasNeg && meaningInDictionary(baseMeaning, dictDef))
      }
      // Follow "See" reference
      if (!matched && seeEntries) {
        matched = seeEntries.some(e => meaningInDictionary(meaning, e) || (hasNeg && meaningInDictionary(baseMeaning, e)))
      }
      // "See" dead end: reference target missing from dictionary — can't validate
      if (!matched && seeDeadEnd) {
        matched = true
      }
      // NEG + dictionary already contains negation = double negation; meaning is antonym, skip validation
      if (!matched && hasNeg && dictDef) {
        const dictClean = dictDef.replace(/<[^>]+>/g, ' ').toLowerCase()
        if (/\bnot\b|\bno\b|\bwithout\b|\b-less\b|\bnon-|\bun-/.test(dictClean)) {
          matched = true
        }
      }
      // Last-resort fallback: scan every entry under the stem.
      // Only when no specific dictDef was resolved — otherwise an MW.X.<id>
      // pointer that doesn't actually match its own entry would silently pass
      // by matching some other sense of the stem (e.g. dama.90249 "house"
      // vs. dama.90250 "subduing").
      if (!matched && !dictDef) {
        matched = allEntries.some(e => meaningInDictionary(meaning, e) || (hasNeg && meaningInDictionary(baseMeaning, e)))
      }

      if (matched) {
        valid++
      } else {
        const snippet = (dictDef || allEntries[0] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 80)
        invalid++
        invalidList.push({ ...row, issue: `"${lexeme}" not found in: "${snippet}…"` })
      }
    }
    return { valid, invalid, invalidList }
  }

  export default {
    name: 'AnalyticsPage',
    data() {
      return {
        vidyutReady: false,
        hoveredSlice: null,
        showInvalidDialog: false,
        invalidType: '',
        invalidEntries: [],
        invalidTableHeaders: [
          { title: 'ID', key: 'id', sortable: true },
          { title: 'Form', key: 'form', sortable: true },
          { title: 'Analysis', key: 'analysis', sortable: true },
          { title: 'Issue', key: 'issue', sortable: true },
        ],
        // Cached validation results
        validationCache: null,
        zipfWords: [],
        invalidDerivedStemsList: [],
        invalidDeclensionsList: [],
        invalidTinList: [],
        invalidMeaningsList: [],
        invalidCoverageList: [],
        invalidLexemeList: [],
        invalidAgreementList: [],
      }
    },
    computed: {
      isDark() {
        return this.$vuetify.theme.global.current.dark
      },
      uniqueInvalidCount() {
        const uniqueValues = new Set()
        for (const entry of this.invalidEntries) {
          if (this.invalidType === 'stems') {
            const mwMatch = (entry.analysis || '').match(/MW\.([^.\s]+)/)
            if (mwMatch) uniqueValues.add(mwMatch[1])
          } else if (this.invalidType === 'derivedStems') {
            uniqueValues.add(entry.analysis)
          } else if (this.invalidType === 'declensions') {
            uniqueValues.add(entry.form)
          } else if (this.invalidType === 'tin') {
            uniqueValues.add(entry.form)
          } else if (this.invalidType === 'meanings') {
            uniqueValues.add(entry.form)
          } else if (this.invalidType === 'coverage') {
            uniqueValues.add(entry.id)
          } else if (this.invalidType === 'lexemes') {
            uniqueValues.add(entry.id + ':' + entry.form)
          } else if (this.invalidType === 'agreement') {
            uniqueValues.add(entry.id)
          }
        }
        return uniqueValues.size
      },
      stats() {
        if (!this.validationCache) {
          return {
            totalWords: lemmas.length,
            mwCount: 0,
            dhatuKrtCount: 0,
            tinCount: 0,
            userCount: 0,
            mwPercent: 0,
            dhatuKrtPercent: 0,
            tinPercent: 0,
            userPercent: 0,
            validStemsPercent: 100,
            validDerivedStemsPercent: 100,
            validDeclensionsPercent: 100,
            validTinPercent: 100,
            validMeaningsPercent: 100,
            validCoveragePercent: 100,
            validLexemePercent: 100,
            validAgreementPercent: 100,
          }
        }
        return this.validationCache
      },
      pieSlices() {
        const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#607D8B']
        const data = [
          { label: 'MW Dictionary', percent: this.stats.mwPercent, count: this.stats.mwCount, color: pieColors[0] },
          { label: 'DHATU+KRT', percent: this.stats.dhatuKrtPercent, count: this.stats.dhatuKrtCount, color: pieColors[1] },
          { label: 'TIN', percent: this.stats.tinPercent, count: this.stats.tinCount, color: pieColors[2] },
          { label: 'USER', percent: this.stats.userPercent, count: this.stats.userCount, color: pieColors[3] },
        ]

        // Generate SVG paths
        let startAngle = -90
        const radius = 80

        return data.map((item) => {
          const angle = (item.percent / 100) * 360
          const endAngle = startAngle + angle

          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180

          const x1 = radius * Math.cos(startRad)
          const y1 = radius * Math.sin(startRad)
          const x2 = radius * Math.cos(endRad)
          const y2 = radius * Math.sin(endRad)

          const largeArc = angle > 180 ? 1 : 0

          const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

          startAngle = endAngle

          return {
            ...item,
            path,
          }
        })
      },
      zipfChart() {
        const words = this.zipfWords || []
        const width = 800
        const height = 360
        const padL = 60; const padR = 30; const padT = 20; const padB = 40
        const empty = {
          width, height, padL, padR, padT, padB,
          totalTokens: 0, uniqueWords: 0,
          slope: 0, intercept: 0, r2: 0,
          xTicks: [], yTicks: [], points: '', topLabels: [],
          refLine: { x1: padL, y1: padT, x2: padL, y2: height - padB },
          fitLine: { x1: padL, y1: padT, x2: padL, y2: height - padB },
        }
        if (!words.length) return empty

        const maxRank = words.length
        const maxFreq = words[0].freq
        const totalTokens = words.reduce((s, w) => s + w.freq, 0)

        // Linear regression on log10(rank) vs log10(freq)
        const n = words.length
        let sumX = 0; let sumY = 0
        for (const w of words) {
          sumX += Math.log10(w.rank)
          sumY += Math.log10(w.freq)
        }
        const meanX = sumX / n
        const meanY = sumY / n
        let sxy = 0; let sxx = 0; let syy = 0
        for (const w of words) {
          const dx = Math.log10(w.rank) - meanX
          const dy = Math.log10(w.freq) - meanY
          sxy += dx * dy
          sxx += dx * dx
          syy += dy * dy
        }
        const slope = sxx > 0 ? sxy / sxx : 0
        const intercept = meanY - slope * meanX
        // R² from explained-vs-total variance, equivalent to (sxy²/(sxx*syy)).
        const r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0

        const plotW = width - padL - padR
        const plotH = height - padT - padB
        const logMaxX = Math.log10(maxRank) || 1
        const logMaxY = Math.log10(maxFreq) || 1
        const xAt = rank => padL + (Math.log10(rank) / logMaxX) * plotW
        const yAt = freq => (height - padB) - (Math.log10(freq) / logMaxY) * plotH

        // Powers-of-10 ticks; always include 1 and the max bound.
        const xTicks = []
        for (let p = 0; Math.pow(10, p) <= maxRank; p++) {
          const v = Math.pow(10, p)
          xTicks.push({ value: v, x: xAt(v) })
        }
        const yTicks = []
        for (let p = 0; Math.pow(10, p) <= maxFreq; p++) {
          const v = Math.pow(10, p)
          yTicks.push({ value: v, y: yAt(v) })
        }

        // Sample to keep the polyline small but faithful: every word for
        // the first 200 ranks, then logarithmic stride beyond.
        const pts = []
        for (let i = 0; i < words.length; i++) {
          const w = words[i]
          if (i < 200 || i === words.length - 1 || i % Math.max(1, Math.floor(i / 100)) === 0) {
            pts.push(`${xAt(w.rank).toFixed(2)},${yAt(w.freq).toFixed(2)}`)
          }
        }

        // Ideal Zipf: freq = maxFreq / rank → straight line slope -1 on log-log.
        const refLine = {
          x1: xAt(1), y1: yAt(maxFreq),
          x2: xAt(maxRank), y2: yAt(Math.max(1, maxFreq / maxRank)),
        }

        // Fitted line from regression: log10(freq) = slope*log10(rank) + intercept.
        const fitFreqAt = r => Math.pow(10, slope * Math.log10(r) + intercept)
        const fitLine = {
          x1: xAt(1), y1: yAt(Math.max(0.1, fitFreqAt(1))),
          x2: xAt(maxRank), y2: yAt(Math.max(0.1, fitFreqAt(maxRank))),
        }

        const topLabels = words.slice(0, 5).map(w => ({
          word: w.word, freq: w.freq, x: xAt(w.rank), y: yAt(w.freq),
        }))

        return {
          width, height, padL, padR, padT, padB,
          totalTokens, uniqueWords: words.length,
          slope, intercept, r2,
          xTicks, yTicks, points: pts.join(' '), topLabels, refLine, fitLine,
        }
      },
    },
    async mounted() {
      // Initialize theme
      this.$vuetify.theme.global.name = localStorage.getItem('theme') || 'dark'

      // Hide the splash screen
      const splashScreen = document.querySelector('.splash')
      if (splashScreen) splashScreen.classList.add('hidden')

      // Initialize Vidyut
      try {
        await initVidyut()
        const dhatupathaText = await (await fetch(dhatupatha)).text()
        vidyut = Vidyut.init(dhatupathaText)

        // Build dhatu lookup index
        dhatuIndex = buildDhatuIndex(dhatupathaText)

        this.vidyutReady = true

        // Run validation
        this.runValidation()
      } catch (e) {
        console.error('Failed to initialize Vidyut:', e)
        // Still mark as ready but show error state
        this.vidyutReady = true
        this.validationCache = {
          totalWords: lemmas.length,
          mwCount: 0,
          dhatuKrtCount: 0,
          tinCount: 0,
          userCount: 0,
          mwPercent: 0,
          dhatuKrtPercent: 0,
          tinPercent: 0,
          userPercent: 0,
          validStemsPercent: 0,
          validDerivedStemsPercent: 0,
          validDeclensionsPercent: 0,
          validMeaningsPercent: 0,
          validStemsCount: 0,
          invalidStemsCount: 0,
          totalStemsCount: 0,
          validDerivedStemsCount: 0,
          invalidDerivedStemsCount: 0,
          totalDerivedStemsCount: 0,
          validDeclensionsCount: 0,
          invalidDeclensionsCount: 0,
          totalDeclensionsCount: 0,
          validTinPercent: 0,
          validTinCount: 0,
          invalidTinCount: 0,
          totalTinCount: 0,
          validMeaningsCount: 0,
          invalidMeaningsCount: 0,
          totalMeaningsCount: 0,
          validCoveragePercent: 0,
          validCoverageCount: 0,
          invalidCoverageCount: 0,
          totalCoverageCount: 0,
          validLexemePercent: 0,
          validLexemeCount: 0,
          invalidLexemeCount: 0,
          totalLexemeCount: 0,
          validAgreementPercent: 0,
          validAgreementCount: 0,
          invalidAgreementCount: 0,
          totalAgreementCount: 0,
          error: `Failed to initialize Vidyut: ${e.message}`
        }
      }
    },
    methods: {

      runValidation () {
        const total = lemmas.length
        const types = classifyTypes(lemmas)
        const stems = validateStems(lemmas)
        const derivations = validateDerivations(lemmas)
        const meanings = validateMeanings(lemmas)
        const coverage = validateCoverage(lemmas, inscriptions)
        const agreement = validateAgreement(lemmas)

        this.zipfWords = computeZipf(inscriptions)
        this.invalidDerivedStemsList = derivations.invalidDerivedList
        this.invalidDeclensionsList = derivations.invalidDeclList
        this.invalidTinList = derivations.invalidTinList
        this.invalidMeaningsList = meanings.invalidList
        this.invalidCoverageList = coverage.invalidCoverageList
        this.invalidLexemeList = coverage.invalidLexemeList
        this.invalidAgreementList = agreement.invalidList

        const totalStems = stems.valid + stems.invalid
        const totalDerivedStems = derivations.validDerived + derivations.invalidDerived
        const totalDeclensions = derivations.validDecl + derivations.invalidDecl
        const totalTin = derivations.validTin + derivations.invalidTin
        const totalMeanings = meanings.valid + meanings.invalid
        const totalCoverage = coverage.validCoverage + coverage.invalidCoverage
        const totalLexeme = coverage.validLexeme + coverage.invalidLexeme
        const totalAgreement = agreement.valid + agreement.invalid

        this.validationCache = {
          totalWords: total,
          mwCount: types.mwCount,
          dhatuKrtCount: types.dhatuKrtCount,
          tinCount: types.tinCount,
          userCount: types.userCount,
          mwPercent: (types.mwCount / total) * 100,
          dhatuKrtPercent: (types.dhatuKrtCount / total) * 100,
          tinPercent: (types.tinCount / total) * 100,
          userPercent: (types.userCount / total) * 100,
          validStemsPercent: totalStems > 0 ? (stems.valid / totalStems) * 100 : 100,
          validDerivedStemsPercent: totalDerivedStems > 0 ? (derivations.validDerived / totalDerivedStems) * 100 : 100,
          validDeclensionsPercent: totalDeclensions > 0 ? (derivations.validDecl / totalDeclensions) * 100 : 100,
          validTinPercent: totalTin > 0 ? (derivations.validTin / totalTin) * 100 : 100,
          validMeaningsPercent: totalMeanings > 0 ? (meanings.valid / totalMeanings) * 100 : 100,
          validCoveragePercent: totalCoverage > 0 ? (coverage.validCoverage / totalCoverage) * 100 : 100,
          validLexemePercent: totalLexeme > 0 ? (coverage.validLexeme / totalLexeme) * 100 : 100,
          validStemsCount: stems.valid,
          invalidStemsCount: stems.invalid,
          totalStemsCount: totalStems,
          validDerivedStemsCount: derivations.validDerived,
          invalidDerivedStemsCount: derivations.invalidDerived,
          totalDerivedStemsCount: totalDerivedStems,
          validDeclensionsCount: derivations.validDecl,
          invalidDeclensionsCount: derivations.invalidDecl,
          totalDeclensionsCount: totalDeclensions,
          validTinCount: derivations.validTin,
          invalidTinCount: derivations.invalidTin,
          totalTinCount: totalTin,
          validMeaningsCount: meanings.valid,
          invalidMeaningsCount: meanings.invalid,
          totalMeaningsCount: totalMeanings,
          validCoverageCount: coverage.validCoverage,
          invalidCoverageCount: coverage.invalidCoverage,
          totalCoverageCount: totalCoverage,
          validLexemeCount: coverage.validLexeme,
          invalidLexemeCount: coverage.invalidLexeme,
          totalLexemeCount: totalLexeme,
          validAgreementPercent: totalAgreement > 0 ? (agreement.valid / totalAgreement) * 100 : 100,
          validAgreementCount: agreement.valid,
          invalidAgreementCount: agreement.invalid,
          totalAgreementCount: totalAgreement,
        }
      },

      toggleInvalid(type) {
        this.invalidType = type
        let entries = []

        if (type === 'derivedStems') {
          entries = this.invalidDerivedStemsList || []
        } else if (type === 'declensions') {
          entries = this.invalidDeclensionsList || []
        } else if (type === 'tin') {
          entries = this.invalidTinList || []
        } else if (type === 'meanings') {
          entries = this.invalidMeaningsList || []
        } else if (type === 'coverage') {
          entries = this.invalidCoverageList || []
        } else if (type === 'lexemes') {
          entries = this.invalidLexemeList || []
        } else if (type === 'agreement') {
          entries = this.invalidAgreementList || []
        } else {
          for (const row of lemmas) {
            const analysis = row.analysis || ''

            if (type === 'stems') {
              const mwMatch = analysis.match(/MW\.([^.\s]+)/)
              if (mwMatch) {
                const stem = mwMatch[1]
                if (!mwIndex.has(stem)) {
                  entries.push({
                    ...row,
                    issue: `MW stem "${stem}" not found in dictionary`,
                  })
                }
                continue
              }
              const userMatch = analysis.match(/\bUSER\.([^.\s]+)/)
              if (userMatch) {
                entries.push({
                  ...row,
                  issue: `USER stem "${userMatch[1]}" not in dictionary`,
                })
              }
            }
          }
        }

        // Stamp each entry with a unique _key so v-data-table sort keeps rows
        // stable. Without this, multiple items sharing the same `id` collide
        // in Vuetify's internal keying and repeated header clicks visually
        // duplicate whichever row won the tie.
        this.invalidEntries = entries.map((e, i) => ({ ...e, _key: i }))
        this.showInvalidDialog = true
      },
    },
  }
</script>

<style scoped>
.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.pie-chart {
  width: 200px;
  height: 200px;
}

.pie-slice {
  cursor: pointer;
  transition: opacity 0.2s;
}

.pie-slice:hover {
  opacity: 0.8;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.legend-item.highlighted {
  background-color: rgba(128, 128, 128, 0.2);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-label {
  flex: 1;
  font-weight: 500;
}

.legend-value {
  font-weight: bold;
}

.validation-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.validation-row {
  cursor: pointer;
}

.validation-row:hover .validation-bar-container {
  opacity: 0.9;
}

.validation-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.validation-bar-container {
  display: flex;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  transition: opacity 0.2s;
}

.validation-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  min-width: 40px;
}

.validation-bar.valid {
  background-color: #4CAF50;
}

.validation-bar.invalid {
  background-color: #FF9800;
}

.zipf-subtitle {
  white-space: normal;
  opacity: 0.7;
}

.zipf-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 16px 0;
}

.zipf-stat {
  font-size: 1.05rem;
  padding: 4px 12px;
  border-radius: 6px;
  background-color: rgba(255, 138, 101, 0.18);
  color: #FF8A65;
  border: 1px solid rgba(255, 138, 101, 0.4);
}

.zipf-stat b {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.zipf-chart-container {
  width: 100%;
  padding: 12px;
}

.zipf-chart {
  width: 100%;
  height: auto;
  max-height: 480px;
}

@media (max-width: 600px) {
  .pie-chart-container {
    flex-direction: column;
  }
}
</style>
