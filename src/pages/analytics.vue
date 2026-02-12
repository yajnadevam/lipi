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
import mwJson from '../assets/data/mw.json'
import initVidyut, { Vidyut } from '../vidyut/vidyut_prakriya.js'
import dhatupatha from '../assets/vidyut/vidyut_dhatupatha_5.tsv'
import { buildDhatuIndex, derive } from '@/scripts/vidyut-derive'

// Parse lemmas data (lazy init to catch errors)
let lemmas = []
let mwIndex = new Set()
let initError = null

try {
  // Convert CRLF to LF - json-2-csv doesn't handle CRLF properly
  lemmas = csv2json(lemmasCsv.replace(/\r\n/g, '\n'))
  mwIndex = new Set(Object.keys(mwJson))
} catch (e) {
  console.error('Failed to initialize data:', e)
  initError = e.message
}

// Vidyut instance (set after initialization)
let vidyut = null

// Dhatu lookup index: maps simplified form (e.g., "Sad") to aupadeshika (e.g., "za\\dx~")
let dhatuIndex = null


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
      invalidDerivedStemsList: [],
      invalidDeclensionsList: [],
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
        } else if (this.invalidType === 'meanings') {
          uniqueValues.add(entry.form)
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
          validMeaningsPercent: 100,
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
        validMeaningsCount: 0,
        invalidMeaningsCount: 0,
        totalMeaningsCount: 0,
        error: `Failed to initialize Vidyut: ${e.message}`
      }
    }
  },
  methods: {

    runValidation() {
      const total = lemmas.length
      let mwCount = 0
      let dhatuKrtCount = 0
      let tinCount = 0
      let userCount = 0

      let validStems = 0
      let invalidStems = 0
      let validDerivedStems = 0
      let invalidDerivedStems = 0
      let validDeclensions = 0
      let invalidDeclensions = 0
      let validMeanings = 0
      let invalidMeanings = 0

      // Store invalid entries for later display
      this.invalidDerivedStemsList = []
      this.invalidDeclensionsList = []

      for (const row of lemmas) {
        const analysis = row.analysis || ''
        const form = row.form || ''

        // Type classification
        if (analysis.startsWith('MW.') || analysis.startsWith('INDC.') || analysis.startsWith('PRON.')) {
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

        // Stem validation (check if MW stem exists in dictionary)
        // Only validate entries that actually reference MW stems
        const mwMatch = analysis.match(/MW\.([^.\s]+)/)
        if (mwMatch) {
          const stem = mwMatch[1]
          if (mwIndex.has(stem)) {
            validStems++
          } else {
            invalidStems++
          }
        }
        // Note: DHATU and other entries are not counted in MW stem validation

        // Derived stems validation (DHATU+KRT, MW+TAD, DHATU+KRT+TAD)
        const hasDhatu = analysis.startsWith('DHATU.')
        const hasKrt = analysis.includes('KRT.')
        const hasTad = analysis.includes('TAD.')

        // Unified vidyut derivation validation via shared module
        const derivablePattern = /\bDHATU\.|\b(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.[MFN]\.[SDP]\b/
        const isDerivable = analysis && form && derivablePattern.test(analysis)
        const caseMatch = analysis.match(/\b(Nom|Voc|Acc|Ins|Dat|Abl|Gen|Loc)\.(M|F|N)\.(S|D|P)\b/)

        if (isDerivable) {
          let result = null
          try {
            result = derive(vidyut, analysis, form, { dhatuIndex })
          } catch (_) { /* derivation error */ }

          // Classify into derived stems or declension validation
          if (hasDhatu && hasKrt && !caseMatch) {
            // DHATU+KRT without case — stem validation
            if (result?.match) {
              validDerivedStems++
            } else {
              invalidDerivedStems++
              this.invalidDerivedStemsList.push({
                ...row,
                issue: result ? `got "${result.text}"` : 'no derivation',
              })
            }
          } else if (caseMatch || (hasDhatu && analysis.includes('TIN.'))) {
            // Declension or TIN validation
            if (result?.match) {
              validDeclensions++
            } else {
              invalidDeclensions++
              this.invalidDeclensionsList.push({
                ...row,
                issue: `vidyut: got "${result?.text || 'no derivation'}"`,
              })
            }
          } else if (hasDhatu && hasKrt) {
            // DHATU+KRT+case counted above via caseMatch branch
            if (result?.match) {
              validDerivedStems++
            } else {
              invalidDerivedStems++
              this.invalidDerivedStemsList.push({
                ...row,
                issue: result ? `got "${result.text}"` : 'no derivation',
              })
            }
          }
        } else if (mwMatch && hasTad && !caseMatch) {
          // MW+TAD without case — just check MW stem exists
          if (mwIndex.has(mwMatch[1])) {
            validDerivedStems++
          } else {
            invalidDerivedStems++
            this.invalidDerivedStemsList.push({ ...row, issue: `MW stem "${mwMatch[1]}" not in dictionary` })
          }
        }

        // Meaning validation (check if translation_lexeme is present)
        const lexeme = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
        if (lexeme) {
          validMeanings++
        } else {
          invalidMeanings++
        }
      }

      const totalStems = validStems + invalidStems
      const totalDerivedStems = validDerivedStems + invalidDerivedStems
      const totalDeclensions = validDeclensions + invalidDeclensions
      const totalMeanings = validMeanings + invalidMeanings

      this.validationCache = {
        totalWords: total,
        mwCount,
        dhatuKrtCount,
        tinCount,
        userCount,
        mwPercent: (mwCount / total) * 100,
        dhatuKrtPercent: (dhatuKrtCount / total) * 100,
        tinPercent: (tinCount / total) * 100,
        userPercent: (userCount / total) * 100,
        validStemsPercent: totalStems > 0 ? (validStems / totalStems) * 100 : 100,
        validDerivedStemsPercent: totalDerivedStems > 0 ? (validDerivedStems / totalDerivedStems) * 100 : 100,
        validDeclensionsPercent: totalDeclensions > 0 ? (validDeclensions / totalDeclensions) * 100 : 100,
        validMeaningsPercent: totalMeanings > 0 ? (validMeanings / totalMeanings) * 100 : 100,
        validStemsCount: validStems,
        invalidStemsCount: invalidStems,
        totalStemsCount: totalStems,
        validDerivedStemsCount: validDerivedStems,
        invalidDerivedStemsCount: invalidDerivedStems,
        totalDerivedStemsCount: totalDerivedStems,
        validDeclensionsCount: validDeclensions,
        invalidDeclensionsCount: invalidDeclensions,
        totalDeclensionsCount: totalDeclensions,
        validMeaningsCount: validMeanings,
        invalidMeaningsCount: invalidMeanings,
        totalMeaningsCount: totalMeanings,
      }
    },

    toggleInvalid(type) {
      this.invalidType = type
      this.invalidEntries = []

      if (type === 'derivedStems') {
        // Use pre-computed list
        this.invalidEntries = this.invalidDerivedStemsList || []
      } else if (type === 'declensions') {
        // Use pre-computed list
        this.invalidEntries = this.invalidDeclensionsList || []
      } else {
        for (const row of lemmas) {
          const analysis = row.analysis || ''

          if (type === 'stems') {
            const mwMatch = analysis.match(/MW\.([^.\s]+)/)
            if (mwMatch) {
              const stem = mwMatch[1]
              if (!mwIndex.has(stem)) {
                this.invalidEntries.push({
                  ...row,
                  issue: `MW stem "${stem}" not found in dictionary`,
                })
              }
            }
          } else if (type === 'meanings') {
            const lexeme = row.translation_lexeme != null ? String(row.translation_lexeme).trim() : ''
            if (!lexeme) {
              this.invalidEntries.push({
                ...row,
                issue: 'Missing translation/meaning',
              })
            }
          }
        }
      }

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

@media (max-width: 600px) {
  .pie-chart-container {
    flex-direction: column;
  }
}
</style>
