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
import lemmasCsv from '../../ivc-lemma-per-inscription.csv?raw'
import mwJson from '../assets/data/mw.json'
import initVidyut, { Vidyut } from '../vidyut/vidyut_prakriya.js'
import dhatupatha from '../assets/vidyut/vidyut_dhatupatha_5.tsv'

// Parse lemmas data (lazy init to catch errors)
let lemmas = []
let mwIndex = new Set()
let initError = null

try {
  lemmas = csv2json(lemmasCsv)
  mwIndex = new Set(Object.keys(mwJson))
} catch (e) {
  console.error('Failed to initialize data:', e)
  initError = e.message
}

// Vidyut instance (set after initialization)
let vidyut = null

// Dhatu lookup index: maps simplified form (e.g., "Sad") to aupadeshika (e.g., "za\\dx~")
let dhatuIndex = null

// Build dhatu index from dhatupatha
function buildDhatuIndex(dhatupathaText) {
  const index = new Map()
  const lines = dhatupathaText.split('\n')

  for (const line of lines) {
    if (!line || line.startsWith('code')) continue
    const parts = line.split('\t')
    if (parts.length < 2) continue

    const aupadeshika = parts[1]

    // First, index the aupadeshika form directly (for CSV entries that already have IT markers)
    if (!index.has(aupadeshika)) {
      index.set(aupadeshika, [])
    }
    index.get(aupadeshika).push(aupadeshika)

    // Strip IT markers to get simplified form
    // IT markers in dhatupatha:
    // - Trailing vowel+~ like a~, i~, I~, u~, U~, f~, F~, x~, e~, o~ (anubandha)
    // - Terminal consonant IT markers: R (ण्), Y (ञ्), p (प्), N (ण) - only if NO vowel+~ at end
    // - \ in the middle (svarita marker)
    // - ^ (ātmanepada marker)
    // - Leading q or o~ (indicates ātmanepada or special)
    // Examples: ha\na~ -> han, eDa~\ -> eD, BaRa~ -> BaR, dA\R -> dA, anjU~ -> anj
    let simplified = aupadeshika
      .replace(/\\/g, '') // Remove \ (svarita marker)
      .replace(/\^/g, '') // Remove ^ (ātmanepada marker)
      .replace(/^[qo]~/g, '') // Remove leading q or o~ (ātmanepada/special marker)
      .replace(/^qu/g, '') // Remove leading qu (ātmanepada marker for certain dhatus)

    // Check if it has a vowel+~ ending (then the consonant before is part of root)
    const hasVowelAnubandha = /[aAiIuUfFxXeEoO]~r?$/.test(simplified)
    simplified = simplified
      .replace(/[aAiIuUfFxXeEoO]~r?$/g, '') // Remove trailing vowel+~ or vowel+~r (anubandha)
      .replace(/~$/g, '') // Remove any remaining ~

    // Only strip terminal consonant IT markers if there was NO vowel+~ ending
    // (If there was a vowel+~, the consonant before it is part of the root)
    if (!hasVowelAnubandha) {
      simplified = simplified.replace(/[RYpN]$/g, '') // Remove trailing R, Y, p, N IT markers
    }

    // Store the simplified form
    if (!index.has(simplified)) {
      index.set(simplified, [])
    }
    index.get(simplified).push(aupadeshika)
  }

  return index
}

// Look up aupadeshika form from simplified dhatu
function lookupDhatu(simplified) {
  if (!dhatuIndex) return null
  return dhatuIndex.get(simplified) || null
}

// Map our case abbreviations to Vidyut vibhakti names (Rust enum variants)
const vibhaktiMap = {
  'Nom': 'Prathama',
  'Acc': 'Dvitiya',
  'Ins': 'Trtiya',
  'Dat': 'Caturthi',
  'Abl': 'Panchami',
  'Gen': 'Sasthi',
  'Loc': 'Saptami',
  'Voc': 'Sambodhana',
}

// Map our gender abbreviations to Vidyut linga names (Rust enum variants)
const lingaMap = {
  'M': 'Pum',
  'F': 'Stri',
  'N': 'Napumsaka',
}

// Map our number abbreviations to Vidyut vacana names (Rust enum variants)
const vacanaMap = {
  'S': 'Eka',
  'D': 'Dvi',
  'P': 'Bahu',
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
        { title: 'ID', key: 'inscription_id', sortable: true },
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
    validateDerivedStemWithVidyut(analysis, form) {
      try {
      // Parse the analysis to extract dhatu and krt info
      // Format: DHATU.root. KRT.suffix or DHATU.root.gana KRT.suffix
      // KRT can be: KRT.suffix or KRT.sanadi.suffix (e.g., KRT.Rici.ac for causative + ac)
      // Dhatu can have upasarga: DHATU.A-han. (आ-√हन्)
      const dhatuMatch = analysis.match(/DHATU\.([^.\s]+)(?:\.(\w+))?/)
      const krtMatch = analysis.match(/KRT\.([^\s]+)/)
      const tadMatch = analysis.match(/TAD\.([^\s]+)/)  // Capture full chain like TAD.mayaw.ini
      const striMatch = analysis.match(/STRI\.([^\s]+)/)  // Strī-pratyaya like STRI.wAp
      const hasNeg = analysis.includes(' NEG ')  // Negation prefix a-/an-

      if (!dhatuMatch) {
        return { valid: true, skipped: true } // Not a DHATU entry
      }

      const rawAupadeshika = dhatuMatch[1]
      const gana = dhatuMatch[2] || 'Bhvadi'

      // Parse upasarga from dhatu (e.g., "A-han" -> upasarga "A", dhatu "han")
      // Map CSV upasarga codes to Vidyut SLP1 format
      // NOTE: Use "A" for ā- (आ-) and reserve "AN" for āṅ (आङ्) explicitly.
      const upasargaMap = {
        'A': 'A',
        'AN': 'AN',
        // Other upasargas use same SLP1 in both CSV and Vidyut:
        // pra, parA, apa, sam, anu, ava, nis, nir, dus, vi, aDi, su, ud, aBi, prati, pari, upa
      }
      const upasarga = []
      let aupadeshika = rawAupadeshika
      if (aupadeshika.includes('-')) {
        const parts = aupadeshika.split('-')
        // Everything except the last part is upasarga
        for (let i = 0; i < parts.length - 1; i++) {
          if (parts[i]) {
            // Map to Vidyut format if needed
            const mapped = upasargaMap[parts[i]] || parts[i]
            upasarga.push(mapped)
          }
        }
        aupadeshika = parts[parts.length - 1]
      }

      // Try to look up the raw aupadeshika first (CSV may already have IT markers)
      let aupadeshikaForms = lookupDhatu(aupadeshika)

      // If not found, try stripping IT markers to get simplified form
      if (!aupadeshikaForms || aupadeshikaForms.length === 0) {
        let simplified = aupadeshika
          .replace(/\\/g, '')
          .replace(/\^/g, '')

        // Check if it has a vowel+~ ending (then the consonant before is part of root)
        const hasVowelAnubandha = /[aAiIuUfFxXeEoO]~r?$/.test(simplified)
        simplified = simplified
          .replace(/[aAiIuUfFxXeEoO]~r?$/g, '')
          .replace(/~$/g, '')

        // Only strip terminal consonant IT markers if there was NO vowel+~ ending
        if (!hasVowelAnubandha) {
          simplified = simplified.replace(/[zN]$/g, '')
        }

        aupadeshika = simplified
        aupadeshikaForms = lookupDhatu(aupadeshika)
      }

      if (krtMatch) {
        // Parse KRT part - could be "suffix" or "sanadi.suffix"
        const krtParts = krtMatch[1].split('.')
        let krtSuffix = krtParts[krtParts.length - 1] // Last part is the actual krt
        const sanadi = []

        // Known sanadis that appear before krt suffix
        const knownSanadis = ['Ric', 'san', 'yaN', 'yaNluk']
        for (let i = 0; i < krtParts.length - 1; i++) {
          if (knownSanadis.includes(krtParts[i])) {
            sanadi.push(krtParts[i])
          }
        }

        // Map lyap to ktvA - lyap is an ādeśa (substitution) for ktvA when there's an upasarga (rule 7.1.37)
        // Vidyut applies this substitution automatically, so we pass ktvA to the API
        if (krtSuffix === 'lyap') {
          krtSuffix = 'ktvA'
        }

        // Validate krt suffix is reasonable (not empty, not too long, only valid characters)
        if (!krtSuffix || krtSuffix.length === 0 || krtSuffix.length > 15 || !/^[a-zA-Z~]+$/.test(krtSuffix)) {
          return { valid: false, expected: `invalid krt suffix: "${krtSuffix}"` }
        }

        // Note: removed unsupportedKrt skip - expose all Vidyut limitations as errors

        // Check if dhatu was found (aupadeshikaForms already looked up above)
        if (!aupadeshikaForms || aupadeshikaForms.length === 0) {
          return { valid: false, expected: `dhatu "${aupadeshika}" not found in dhatupatha` }
        }

        // All possible ganas to try if specified gana doesn't work
        const allGanas = ['Bhvadi', 'Adadi', 'Juhotyadi', 'Divadi', 'Svadi', 'Tudadi', 'Rudhadi', 'Tanadi', 'Kryadi', 'Curadi']
        // Only use the specified gana if it's a valid gana name (not a numeric like '1' or '10')
        const isValidGana = allGanas.includes(gana)
        const ganasToTry = isValidGana && gana !== 'Bhvadi' ? [gana, ...allGanas.filter(g => g !== gana)] : allGanas

        // Try each possible aupadeshika form and gana until one produces a matching form
        // Important: Don't stop at first successful derivation - it might be wrong dhātu/gaṇa combo
        let lastError = null
        let allDerivedStems = new Set()
        let allNegatedForms = null  // Track negated forms for better error messages
        let declinedSampleByStem = new Map()
        const caseMatch = analysis.match(/\b(Nom|Voc|Acc|Ins|Dat|Abl|Gen|Loc)\.(M|F|N)\.(S|D|P)\b/)

        for (const aupa of aupadeshikaForms) {
          // Skip malformed aupadeshika entries (must have IT markers or be valid)
          if (!aupa || aupa.length === 0 || aupa.length > 20) {
            continue
          }

          for (const tryGana of ganasToTry) {
            try {
              const dhatu = {
                aupadeshika: aupa,
                gana: tryGana,
                sanadi: sanadi,
                prefixes: upasarga,
                antargana: null,
              }

              const results = vidyut.deriveKrdantas({
                dhatu: dhatu,
                krt: krtSuffix,
                lakara: null,
                prayoga: null,
              })

              if (results && results.length > 0) {
                // Krdanta derivation succeeded - check if any derived stem can produce the form
                const derivedStems = results.map(r => r.text)
                derivedStems.forEach(s => allDerivedStems.add(s))

                // If there's a TAD suffix, derive krdanta → taddhita (→ optional declension)
                if (tadMatch) {
                  const tadSuffixes = tadMatch[1].split('.')
                  const finalSuffix = tadSuffixes[tadSuffixes.length - 1]

                  // Check if the suffix is a strī-pratyaya (feminine suffix) like wAp, cAp, dAp, NIp, NIn
                  // These are NOT taddhitas - they should use STRI. marker instead of TAD.
                  const striPratyayas = ['wAp', 'cAp', 'dAp', 'qAp', 'NIp', 'NIn', 'UN', 'wI', 'NI']
                  if (striPratyayas.includes(finalSuffix)) {
                    return { valid: false, expected: `"${finalSuffix}" is a strī-pratyaya, not a taddhita - use STRI.${finalSuffix} instead of TAD.${finalSuffix}` }
                  }

                  // Try each derived krdanta stem as base for taddhita
                  for (const krdStem of derivedStems) {
                    try {
                      // Apply taddhita suffixes sequentially (for chains like mayaw.ini)
                      let currentStem = krdStem
                      let tadDerivationFailed = false

                      for (let i = 0; i < tadSuffixes.length - 1; i++) {
                        const suffix = tadSuffixes[i]
                        const tadResults = vidyut.deriveTaddhitantas({
                          pratipadika: { basic: currentStem },
                          taddhita: suffix,
                        })
                        if (tadResults && tadResults.length > 0) {
                          currentStem = tadResults[0].text
                        } else {
                          tadDerivationFailed = true
                          break
                        }
                      }

                      if (tadDerivationFailed) continue

                      // Final suffix - derive taddhitanta
                      const finalSuffix = tadSuffixes[tadSuffixes.length - 1]
                      const tadResults = vidyut.deriveTaddhitantas({
                        pratipadika: { basic: currentStem },
                        taddhita: finalSuffix,
                      })

                      if (tadResults && tadResults.length > 0) {
                        // Check if any taddhita-derived stem matches the form directly (stem entry)
                        const tadStems = tadResults.map(r => r.text)
                        if (tadStems.some(s => s === form)) {
                          return { valid: true, stems: derivedStems, taddhita: tadSuffixes }
                        }

                        // If there's case info, also try declining the taddhita stem
                        if (caseMatch) {
                          const [, vibhakti, linga, vacana] = caseMatch
                          const subantaResults = vidyut.deriveSubantas({
                            pratipadika: {
                              taddhitanta: { stem: currentStem, taddhita: finalSuffix },
                            },
                            linga: lingaMap[linga],
                            vacana: vacanaMap[vacana],
                            vibhakti: vibhaktiMap[vibhakti],
                          })

                          if (subantaResults && subantaResults.some(r => r.text === form)) {
                            return { valid: true, stems: derivedStems, taddhita: tadSuffixes }
                          }
                        }
                      }
                    } catch (e) {
                      // Continue trying other stems
                    }
                  }
                  // This dhātu+gaṇa combo didn't produce the form with taddhita - continue
                  continue
                }

                // If there's a STRI suffix, use Vidyut's deriveStryantas to derive feminine stem
                if (striMatch) {
                  const striSuffix = striMatch[1]

                  // Use Vidyut's deriveStryantas with krdanta pratipadika
                  try {
                    const striResults = vidyut.deriveStryantas({
                      krdanta: {
                        dhatu: dhatu,
                        krt: krtSuffix,
                      }
                    })

                    if (striResults && striResults.length > 0) {
                      const striStems = striResults.map(r => r.text)

                      // Check if any strī-derived stem matches form directly (stem entry)
                      if (striStems.some(s => s === form)) {
                        return { valid: true, stems: derivedStems, stri: striSuffix }
                      }

                      // If there's case info, decline using nyap pratipadika
                      if (caseMatch) {
                        const [, vibhakti, linga, vacana] = caseMatch
                        for (const striStem of striStems) {
                          try {
                            const subantaResults = vidyut.deriveSubantas({
                              pratipadika: { nyap: striStem },
                              linga: lingaMap[linga],
                              vacana: vacanaMap[vacana],
                              vibhakti: vibhaktiMap[vibhakti],
                            })

                            if (subantaResults && subantaResults.some(r => r.text === form)) {
                              return { valid: true, stems: derivedStems, stri: striSuffix }
                            }
                          } catch (e) {
                            // Continue trying other stems
                          }
                        }
                      }
                    }
                  } catch (e) {
                    // Continue trying other dhatu/gana combos
                  }
                  // This dhātu+gaṇa combo didn't produce the form with strī-pratyaya - continue
                  continue
                }

                // Check if form matches a derived stem exactly (stem entries)
                const exactMatch = derivedStems.some(stem => stem === form)
                if (exactMatch) {
                  return { valid: true, stems: derivedStems }
                }

                // Parse case info from analysis to check declined forms
                if (caseMatch) {
                  const [, vibhakti, linga, vacana] = caseMatch
                  // Try declining each derived stem to see if any produces the form
                  for (const stem of derivedStems) {
                    try {
                      // First try with krdanta pratipadika (enables krdanta-specific rules)
                      const krdantaPratipadika = {
                        krdanta: {
                          dhatu: dhatu,
                          krt: krtSuffix,
                          sanadi: sanadi,
                          prefixes: upasarga,
                        }
                      }

                      let subantaResults = vidyut.deriveSubantas({
                        pratipadika: krdantaPratipadika,
                        linga: lingaMap[linga],
                        vacana: vacanaMap[vacana],
                        vibhakti: vibhaktiMap[vibhakti],
                      })

                      // Also try with basic pratipadika using the actual derived stem text
                      // This handles cases where Vidyut's krdanta derivation differs
                      const basicResults = vidyut.deriveSubantas({
                        pratipadika: { basic: stem },
                        linga: lingaMap[linga],
                        vacana: vacanaMap[vacana],
                        vibhakti: vibhaktiMap[vibhakti],
                      })

                      // Combine results from both approaches
                      subantaResults = [...(subantaResults || []), ...(basicResults || [])]

                      // For NEG entries, check if form = a/an + declined_form
                      if (hasNeg) {
                        const negatedForms = []
                        for (const r of subantaResults || []) {
                          const declinedForm = r.text
                          // a- before consonant, an- before vowel
                          const startsWithVowel = /^[aAiIuUfFxXeEoO]/.test(declinedForm)
                          const negatedForm = startsWithVowel ? 'an' + declinedForm : 'a' + declinedForm
                          negatedForms.push(negatedForm)
                          if (negatedForm === form) {
                            return { valid: true, stems: derivedStems, negated: true }
                          }
                        }
                        // Store negated forms for error reporting if this dhatu/gana doesn't work
                        if (negatedForms.length > 0 && !allNegatedForms) {
                          allNegatedForms = negatedForms
                        }
                      } else if (subantaResults && subantaResults.some(r => r.text === form)) {
                        return { valid: true, stems: derivedStems }
                      }
                      if (subantaResults && subantaResults.length > 0 && !declinedSampleByStem.has(stem)) {
                        declinedSampleByStem.set(stem, subantaResults.map(r => r.text).slice(0, 5))
                      }
                    } catch (e) {
                      // Continue trying other stems
                    }
                  }
                  // This dhātu+gaṇa combo didn't work - continue trying others
                  continue
                }

                // No case info and no exact match - continue trying other combos
                continue
              }
            } catch (e) {
              lastError = e
              // Continue trying other aupadeshika forms and ganas
            }
          }
        }

        // None of the dhātu+gaṇa combinations produced a matching form
        if (allDerivedStems.size > 0) {
          const stemList = Array.from(allDerivedStems).join(', ')
          const tadInfo = tadMatch ? ` + TAD.${tadMatch[1]}` : ''
          const striInfo = striMatch ? ` + STRI.${striMatch[1]}` : ''
          const negInfo = hasNeg ? ' + NEG' : ''
          if (caseMatch) {
            // For NEG entries, show the actual negated forms Vidyut produced
            const negFormsInfo = hasNeg && allNegatedForms ? ` (produces: ${allNegatedForms.join(', ')})` : ''
            let sampleInfo = ''
            if (declinedSampleByStem.size > 0) {
              const samples = Array.from(declinedSampleByStem.entries())
                .slice(0, 3)
                .map(([st, forms]) => `${st}: ${forms.join(', ')}`)
                .join(' ; ')
              sampleInfo = samples ? ` (samples: ${samples})` : ''
            }
            return { valid: false, expected: `krdanta stems [${stemList}]${tadInfo}${striInfo}${negInfo} do not decline to form "${form}"${negFormsInfo}${sampleInfo}` }
          }
          return { valid: false, expected: `krdanta stems [${stemList}]${tadInfo}${striInfo}${negInfo} do not match form "${form}"` }
        }
        return { valid: false, expected: lastError ? `error: ${lastError.message || 'unknown'}` : 'no krdanta derivation possible' }
      }

      // DHATU without KRT - just check if dhatu exists in our index
      if (aupadeshikaForms && aupadeshikaForms.length > 0) {
        return { valid: true }
      }
      return { valid: false, expected: `dhatu "${aupadeshika}" not found in dhatupatha` }
      } catch (e) {
        // Catch any WASM memory errors or other unexpected errors
        return { valid: false, expected: `error: ${e.message || 'unknown error'}` }
      }
    },

    validateMwTadWithVidyut(analysis) {
      // For MW + TAD entries, validate that the MW stem exists
      const mwMatch = analysis.match(/MW\.([^.\s]+)/)
      const tadMatch = analysis.match(/TAD\.([^\s]+)/)  // Capture full chain like TAD.mayaw.ini

      if (!mwMatch || !tadMatch) {
        return { valid: true, skipped: true }
      }

      const stem = mwMatch[1]

      // Check if MW stem exists
      if (!mwIndex.has(stem)) {
        return { valid: false, expected: `MW stem "${stem}" not found` }
      }

      return { valid: true, hasTad: true }
    },

    validateTaddhitaDeclensionWithVidyut(form, baseStem, tadSuffixes, vibhakti, linga, vacana) {
      // Use Vidyut's taddhitanta pratipadika to properly decline taddhita-derived stems
      // This ensures proper declension rules for -vat/-mat stems etc.
      // tadSuffixes can be a string (single suffix) or array (chained suffixes like mayaw.ini)
      try {
        const suffixArray = Array.isArray(tadSuffixes) ? tadSuffixes : [tadSuffixes]

        // For chained suffixes (e.g., mayaw.ini), derive intermediate stems sequentially
        // Start with base stem and apply each suffix to get the next stem
        let currentStem = baseStem
        for (let i = 0; i < suffixArray.length - 1; i++) {
          const suffix = suffixArray[i]
          // Derive taddhitanta to get the intermediate stem
          const tadResults = vidyut.deriveTaddhitantas({
            pratipadika: { basic: currentStem },
            taddhita: suffix,
          })
          if (tadResults && tadResults.length > 0) {
            // Use the first derived stem as base for next suffix
            currentStem = tadResults[0].text
          } else {
            // Can't derive intermediate - expose error
            return { valid: false, expected: `Vidyut cannot derive: ${currentStem} + ${suffix}` }
          }
        }

        // Now apply the final suffix and decline
        const finalSuffix = suffixArray[suffixArray.length - 1]
        const args = {
          pratipadika: {
            taddhitanta: {
              stem: currentStem,
              taddhita: finalSuffix,
            },
          },
          linga: lingaMap[linga],
          vacana: vacanaMap[vacana],
          vibhakti: vibhaktiMap[vibhakti],
        }
        const results = vidyut.deriveSubantas(args)

        if (results && results.length > 0) {
          // Check if any derived form matches
          for (const result of results) {
            if (result.text === form) {
              return { valid: true }
            }
          }
          // Return expected forms
          const expected = results.map(r => r.text).join(', ')
          return { valid: false, expected: expected || 'no derivation' }
        }

        // deriveSubantas returned empty - try deriveTaddhitantas to see what stem Vidyut produces
        const tadResults = vidyut.deriveTaddhitantas({
          pratipadika: { basic: currentStem },
          taddhita: finalSuffix,
        })
        if (tadResults && tadResults.length > 0) {
          const derivedStems = tadResults.map(r => r.text).join(', ')
          return { valid: false, expected: `Vidyut derives stem [${derivedStems}] but cannot decline to "${form}"` }
        }
        const suffixStr = Array.isArray(tadSuffixes) ? tadSuffixes.join(' + ') : tadSuffixes
        return { valid: false, expected: `Vidyut cannot derive taddhita: ${baseStem} + ${suffixStr}` }
      } catch (e) {
        // Expose Vidyut error
        return { valid: false, expected: `Vidyut error: ${e.message}` }
      }
    },

    validateDeclensionWithVidyut(form, stem, vibhakti, linga, vacana) {
      // Try to derive the form using vidyut and check if it matches
      try {
        // Feminine stems ending in -A/-I/-U have nyāp pratyayas (ṭāp, ṅīp, etc.)
        let pratipadika
        if (linga === 'F' && (stem.endsWith('A') || stem.endsWith('I') || stem.endsWith('U'))) {
          pratipadika = { nyap: stem }
        } else {
          pratipadika = { basic: stem }
        }

        const args = {
          pratipadika,
          linga: lingaMap[linga],
          vacana: vacanaMap[vacana],
          vibhakti: vibhaktiMap[vibhakti],
        }
        const results = vidyut.deriveSubantas(args)

        // Check if any derived form matches the given form
        for (const result of results) {
          if (result.text === form) {
            return { valid: true }
          }
        }

        // Return expected form(s) if not valid
        const expected = results.map(r => r.text).join(', ')
        return { valid: false, expected: expected || 'no derivation' }
      } catch (e) {
        // Expose Vidyut error
        return { valid: false, expected: `Vidyut error: ${e.message}` }
      }
    },

    validateNegatedDeclension(form, stem, vibhakti, linga, vacana) {
      // For NEG entries, the form has a- or an- prefix
      // Check if form = a/an + declined_stem
      try {
        // Feminine stems ending in -A/-I/-U have nyāp pratyayas (ṭāp, ṅīp, etc.)
        let pratipadika
        if (linga === 'F' && (stem.endsWith('A') || stem.endsWith('I') || stem.endsWith('U'))) {
          pratipadika = { nyap: stem }
        } else {
          pratipadika = { basic: stem }
        }

        const results = vidyut.deriveSubantas({
          pratipadika,
          linga: lingaMap[linga],
          vacana: vacanaMap[vacana],
          vibhakti: vibhaktiMap[vibhakti],
        })

        for (const result of results) {
          const declinedForm = result.text
          // Check a- prefix (before consonants)
          if (form === 'a' + declinedForm) {
            return { valid: true }
          }
          // Check an- prefix (before vowels)
          if (form === 'an' + declinedForm) {
            return { valid: true }
          }
          // Also check if the form directly matches (some stems already include negation)
          if (form === declinedForm) {
            return { valid: true }
          }
        }

        const expected = results.map(r => r.text).join(', ')
        return { valid: false, expected: expected || 'no derivation' }
      } catch (e) {
        // Expose Vidyut error
        return { valid: false, expected: `Vidyut error: ${e.message}` }
      }
    },

    validatePronounWithVidyut(form, stem, vibhakti, linga, vacana) {
      // Validate pronoun declension using Vidyut's deriveSubantas with basic pratipadika
      // Vidyut recognizes sarvanama stems (tad, idam, asmad, yuzmad, etc.) and applies
      // the correct pronominal declension rules (1.1.27: sarvādīni sarvanāmāni)
      try {
        const args = {
          pratipadika: { basic: stem },
          linga: lingaMap[linga],
          vacana: vacanaMap[vacana],
          vibhakti: vibhaktiMap[vibhakti],
        }
        const results = vidyut.deriveSubantas(args)

        // Check if any derived form matches the given form
        for (const result of results) {
          if (result.text === form) {
            return { valid: true }
          }
        }

        // Return expected form(s) if not valid
        const expected = results.map(r => r.text).join(', ')
        return { valid: false, expected: expected || 'no derivation' }
      } catch (e) {
        // Expose Vidyut error
        return { valid: false, expected: `Vidyut error: ${e.message}` }
      }
    },

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

        if (hasDhatu && hasKrt) {
          // DHATU+KRT or DHATU+KRT+TAD - validate krdanta derivation
          const validation = this.validateDerivedStemWithVidyut(analysis, form)
          if (validation.valid) {
            validDerivedStems++
          } else {
            invalidDerivedStems++
            this.invalidDerivedStemsList.push({
              ...row,
              issue: validation.expected,
            })
          }
        } else if (mwMatch && hasTad) {
          // MW+TAD - validate MW stem exists (can't validate taddhita without API)
          const validation = this.validateMwTadWithVidyut(analysis)
          if (validation.valid) {
            validDerivedStems++
          } else {
            invalidDerivedStems++
            this.invalidDerivedStemsList.push({
              ...row,
              issue: validation.expected,
            })
          }
        }

        // Declension validation using Vidyut
        // Only count entries where actual Vidyut declension validation is performed
        if (row.type === 'word') {
          const caseMatch = analysis.match(/\b(Nom|Voc|Acc|Ins|Dat|Abl|Gen|Loc)\.(M|F|N)\.(S|D|P)\b/)

          if (caseMatch && mwMatch && !hasTad) {
            // MW entry with case info (no taddhita) - validate with Vidyut
            const [, vibhakti, linga, vacana] = caseMatch
            const stem = mwMatch[1]
            const hasNeg = analysis.includes(' NEG')

            // For NEG entries, check if form with negative prefix matches
            let validation
            if (hasNeg) {
              // Try validating by checking if the declined stem matches the form without a-/an- prefix
              validation = this.validateNegatedDeclension(form, stem, vibhakti, linga, vacana)
            } else {
              validation = this.validateDeclensionWithVidyut(form, stem, vibhakti, linga, vacana)
            }

            if (validation.valid) {
              validDeclensions++
            } else {
              invalidDeclensions++
              this.invalidDeclensionsList.push({
                ...row,
                issue: `vidyut: ${validation.expected}`,
              })
            }
          } else if (caseMatch && mwMatch && hasTad) {
            // MW+TAD entries - validate declension using Vidyut's taddhitanta derivation
            const [, vibhakti, linga, vacana] = caseMatch
            const baseStem = mwMatch[1]
            // TAD can have multiple suffixes chained: TAD.mayaw.ini means mayaw then ini
            const tadMatch = analysis.match(/TAD\.([^\s]+)/)
            const tadSuffixes = tadMatch?.[1]?.split('.') || []

            // Use Vidyut to derive the taddhitanta form and validate declension
            const validation = this.validateTaddhitaDeclensionWithVidyut(form, baseStem, tadSuffixes, vibhakti, linga, vacana)
            if (validation.valid) {
              validDeclensions++
            } else {
              invalidDeclensions++
              this.invalidDeclensionsList.push({
                ...row,
                issue: `vidyut: ${validation.expected}`,
              })
            }
          } else if (caseMatch && analysis.startsWith('PRON.')) {
            // PRON entry with case info - validate with Vidyut
            const [, vibhakti, linga, vacana] = caseMatch
            // Extract pronoun stem from PRON.stem or PRON.stem.number format
            const pronMatch = analysis.match(/PRON\.([^.\s]+)/)
            if (pronMatch) {
              const stem = pronMatch[1]
              const validation = this.validatePronounWithVidyut(form, stem, vibhakti, linga, vacana)
              if (validation.valid) {
                validDeclensions++
              } else {
                invalidDeclensions++
                this.invalidDeclensionsList.push({
                  ...row,
                  issue: `vidyut: ${validation.expected}`,
                })
              }
            }
            // If no pronMatch, don't count - not validated
          }
          // Note: TIN, INDC, DHATU+KRT entries are not counted in declension validation
          // They either don't decline (verbs/indeclinables) or are validated via krdanta derivation
        }
        // Note: non-word entries (type !== 'word') are not counted in declension validation

        // Meaning validation (check if translation_lexeme is present)
        if (row.translation_lexeme && row.translation_lexeme.trim()) {
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
            if (!row.translation_lexeme || !row.translation_lexeme.trim()) {
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
