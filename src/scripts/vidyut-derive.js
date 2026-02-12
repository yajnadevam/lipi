// Shared vidyut derivation engine
// Used by both index.vue (badge system) and analytics.vue (validation)

// --- Constants ---

export const CASE_MAP = {
  Nom: 'Prathama',
  Acc: 'Dvitiya',
  Ins: 'Trtiya',
  Dat: 'Caturthi',
  Abl: 'Panchami',
  Gen: 'Sasthi',
  Loc: 'Saptami',
  Voc: 'Sambodhana',
}

export const GENDER_MAP = { M: 'Pum', F: 'Stri', N: 'Napumsaka' }

export const NUMBER_MAP = { S: 'Eka', D: 'Dvi', P: 'Bahu' }

export const GANA_NUM_MAP = {
  1: 'Bhvadi',
  2: 'Adadi',
  3: 'Juhotyadi',
  4: 'Divadi',
  5: 'Svadi',
  6: 'Tudadi',
  7: 'Rudhadi',
  8: 'Tanadi',
  9: 'Kryadi',
  10: 'Curadi',
}

export const PURUSHA_MAP = { 1: 'Uttama', 2: 'Madhyama', 3: 'Prathama' }

export const LAKARA_MAP = {
  law: 'Lat',
  liw: 'Lit',
  luw: 'Lut',
  lfw: 'Lrt',
  lew: 'Let',
  low: 'Lot',
  laN: 'Lan',
  viDiliN: 'VidhiLin',
  ASIrliN: 'AshirLin',
  luN: 'Lun',
  lfN: 'Lrn',
}

export const ALL_GANAS = [
  'Bhvadi', 'Adadi', 'Juhotyadi', 'Divadi', 'Svadi',
  'Tudadi', 'Rudhadi', 'Tanadi', 'Kryadi', 'Curadi',
]

// --- Utilities ---

export function createDhatu (aupadeshika, gana, sanadi = [], prefixes = []) {
  // Parse upasarga from aupadeshika if present (e.g., "A-hana~" → prefix "A", root "hana~")
  if (aupadeshika && aupadeshika.includes('-')) {
    const segments = aupadeshika.split('-')
    prefixes = [...prefixes, ...segments.slice(0, -1)]
    aupadeshika = segments[segments.length - 1]
  }
  return { aupadeshika, gana, antargana: null, sanadi, prefixes }
}

/**
 * Build a Map from dhatupatha TSV: simplified root → [aupadeshika forms]
 * Indexes both the raw aupadeshika and a simplified form (IT markers stripped)
 */
export function buildDhatuIndex (dhatupathaText) {
  const index = new Map()
  for (const line of dhatupathaText.split('\n')) {
    if (!line || line.startsWith('code')) continue
    const parts = line.split('\t')
    if (parts.length < 2) continue

    const aupadeshika = parts[1]

    // Index the raw aupadeshika form
    if (!index.has(aupadeshika)) index.set(aupadeshika, [])
    index.get(aupadeshika).push(aupadeshika)

    // Strip IT markers to get simplified form
    let simplified = aupadeshika
      .replace(/\\/g, '') // Remove \ (svarita marker)
      .replace(/\^/g, '') // Remove ^ (ātmanepada marker)
      .replace(/^[qo]~/g, '') // Remove leading q or o~
      .replace(/^qu/g, '') // Remove leading qu

    const hasVowelAnubandha = /[aAiIuUfFxXeEoO]~r?$/.test(simplified)
    simplified = simplified
      .replace(/[aAiIuUfFxXeEoO]~r?$/g, '') // Remove trailing vowel+~ anubandha
      .replace(/~$/g, '')

    // Only strip terminal consonant IT markers if no vowel+~ ending
    if (!hasVowelAnubandha) {
      simplified = simplified.replace(/[RYpN]$/g, '')
    }

    if (!index.has(simplified)) index.set(simplified, [])
    index.get(simplified).push(aupadeshika)
  }
  return index
}

export function lookupDhatu (index, key) {
  if (!index) return null
  return index.get(key) || null
}

// --- Internal helpers ---

/** Try to find matching aupadeshika forms, with IT marker stripping fallback */
function resolveAupadeshika (dhatuIndex, aupadeshika) {
  if (!dhatuIndex) return [aupadeshika]

  let forms = lookupDhatu(dhatuIndex, aupadeshika)
  if (forms && forms.length > 0) return forms

  // Strip IT markers and retry
  let simplified = aupadeshika
    .replace(/\\/g, '')
    .replace(/\^/g, '')

  const hasVowelAnubandha = /[aAiIuUfFxXeEoO]~r?$/.test(simplified)
  simplified = simplified
    .replace(/[aAiIuUfFxXeEoO]~r?$/g, '')
    .replace(/~$/g, '')
  if (!hasVowelAnubandha) {
    simplified = simplified.replace(/[zN]$/g, '')
  }

  forms = lookupDhatu(dhatuIndex, simplified)
  return (forms && forms.length > 0) ? forms : [aupadeshika]
}

/** Build gana priority list: specified gana first, then all others */
function ganasToTry (gana) {
  const isValid = ALL_GANAS.includes(gana)
  if (isValid && gana !== 'Bhvadi') {
    return [gana, ...ALL_GANAS.filter(g => g !== gana)]
  }
  return ALL_GANAS
}

/** Make a result object */
function makeResult (steps, text, slp1Form) {
  return { steps, text, match: text === slp1Form }
}

// --- Derivation sub-routines ---

function deriveTinanta (vidyut, slp1Form, root, gana, lakara, vacana, purusha, upasargas, dhatuIndex) {
  const aupadeshikaForms = resolveAupadeshika(dhatuIndex, root)
  let fallback = null

  for (const aupa of aupadeshikaForms) {
    for (const tryGana of ganasToTry(gana)) {
      for (const pada of ['Parasmaipada', 'Atmanepada']) {
        try {
          const dhatu = createDhatu(aupa, tryGana, [], upasargas)
          const results = vidyut.deriveTinantas({
            dhatu,
            lakara,
            vacana,
            purusha,
            prayoga: 'Kartari',
            pada,
            sanadi: [],
            upasarga: dhatu.prefixes,
          })
          for (const r of results) {
            if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
            if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
          }
        } catch (_) { /* try next */ }
      }
    }
  }
  return fallback
}

function deriveKrdantaStems (vidyut, dhatu, pratyaya, upasargas) {
  return vidyut.deriveKrdantas({
    dhatu,
    krt: pratyaya,
    lakara: null,
    prayoga: null,
  })
}

function deriveTaddhitaChain (vidyut, baseStem, tadSuffixes, baseSteps, linga, vacana, vibhakti, slp1Form) {
  let currentStem = baseStem
  let allSteps = [...baseSteps]

  // Apply intermediate suffixes
  for (let i = 0; i < tadSuffixes.length - 1; i++) {
    const tadResults = vidyut.deriveTaddhitantas({
      pratipadika: { basic: currentStem },
      taddhita: tadSuffixes[i],
    })
    if (tadResults && tadResults.length > 0) {
      allSteps = allSteps.concat(tadResults[0].history)
      currentStem = tadResults[0].text
    } else {
      return null
    }
  }

  const finalSuffix = tadSuffixes[tadSuffixes.length - 1]

  if (linga && vacana && vibhakti) {
    let fallback = null

    // 1. Try taddhitanta pratipadika directly
    try {
      const results = vidyut.deriveSubantas({
        pratipadika: { taddhitanta: { stem: currentStem, taddhita: finalSuffix } },
        linga,
        vacana,
        vibhakti,
      })
      for (const r of results) {
        if (r.text === slp1Form) return makeResult(allSteps.concat(r.history), r.text, slp1Form)
        if (!fallback) fallback = makeResult(allSteps.concat(r.history), r.text, slp1Form)
      }
    } catch (_) { /* fall through to two-step */ }

    // 2. Fallback: derive taddhita stem first, then decline as basic pratipadika
    try {
      const tadResults = vidyut.deriveTaddhitantas({
        pratipadika: { basic: currentStem },
        taddhita: finalSuffix,
      })
      for (const tr of (tadResults || [])) {
        const stemSteps = allSteps.concat(tr.history)
        try {
          const subResults = vidyut.deriveSubantas({
            pratipadika: { basic: tr.text },
            linga,
            vacana,
            vibhakti,
          })
          for (const r of subResults) {
            if (r.text === slp1Form) return makeResult(stemSteps.concat(r.history), r.text, slp1Form)
            if (!fallback) fallback = makeResult(stemSteps.concat(r.history), r.text, slp1Form)
          }
        } catch (_) { /* try next tad stem */ }
      }
    } catch (_) { /* taddhita derivation failed */ }

    return fallback
  } else {
    // Just taddhita without declension
    const results = vidyut.deriveTaddhitantas({
      pratipadika: { basic: currentStem },
      taddhita: finalSuffix,
    })
    if (results && results.length > 0) {
      return makeResult(allSteps.concat(results[0].history), results[0].text, slp1Form)
    }
    return null
  }
}

function deriveSubanta (vidyut, slp1Form, dhatu, pratyaya, sanadi, upasargas, linga, vacana, vibhakti) {
  let fallback = null

  // 1. Try krdanta pratipadika
  if (pratyaya) {
    const krdantaPratipadika = {
      krdanta: { dhatu, krt: pratyaya, sanadi, prefixes: upasargas },
    }
    try {
      const results = vidyut.deriveSubantas({ pratipadika: krdantaPratipadika, linga, vacana, vibhakti })
      for (const r of results) {
        if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
        if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
      }
    } catch (_) { /* fall through */ }

    // 2. Try basic pratipadika with derived krdanta stems
    try {
      const krdStems = deriveKrdantaStems(vidyut, dhatu, pratyaya, upasargas)
      for (const kr of krdStems) {
        try {
          const basicResults = vidyut.deriveSubantas({
            pratipadika: { basic: kr.text }, linga, vacana, vibhakti,
          })
          for (const r of basicResults) {
            if (r.text === slp1Form) return makeResult(kr.history.concat(r.history), r.text, slp1Form)
            if (!fallback) fallback = makeResult(kr.history.concat(r.history), r.text, slp1Form)
          }
        } catch (_) { /* try next stem */ }
      }
    } catch (_) { /* no krdanta stems */ }
  } else {
    // Basic pratipadika (MW/PRON)
    const pratipadika = { basic: dhatu.aupadeshika }
    try {
      const results = vidyut.deriveSubantas({ pratipadika, linga, vacana, vibhakti })
      for (const r of results) {
        if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
        if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
      }
    } catch (_) { /* fall through */ }
  }

  return fallback
}

function deriveStriSubanta (vidyut, slp1Form, dhatu, pratyaya, linga, vacana, vibhakti) {
  try {
    const striResults = vidyut.deriveStryantas({
      krdanta: { dhatu, krt: pratyaya },
    })
    if (!striResults || striResults.length === 0) return null

    // Check if a stri stem matches directly (stem entry, no case)
    if (!linga) {
      for (const r of striResults) {
        if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
      }
      return striResults.length > 0
        ? makeResult(striResults[0].history, striResults[0].text, slp1Form)
        : null
    }

    // Decline using nyap pratipadika
    for (const sr of striResults) {
      try {
        const subantaResults = vidyut.deriveSubantas({
          pratipadika: { nyap: sr.text },
          linga,
          vacana,
          vibhakti,
        })
        for (const r of subantaResults) {
          if (r.text === slp1Form) return makeResult(sr.history.concat(r.history), r.text, slp1Form)
        }
      } catch (_) { /* try next stri stem */ }
    }
  } catch (_) { /* stri derivation failed */ }
  return null
}

// --- Main entry point ---

/**
 * Derive a Sanskrit form from an analysis string using vidyut.
 *
 * @param {object} vidyut - Initialized Vidyut WASM instance
 * @param {string} analysis - Analysis string (e.g., "DHATU.BU. KRT.kta Nom.M.S")
 * @param {string} slp1Form - Expected form in SLP1 transliteration
 * @param {object} [options]
 * @param {Map} [options.dhatuIndex] - From buildDhatuIndex(), enables multi-aupadeshika lookup
 * @param {object} [options.wordsMap] - Legacy wordsMap for gana fallback
 * @param {string} [options.itemId] - Seal ID for wordsMap lookup
 * @returns {{ steps: Array, text: string, match: boolean } | null}
 */
export function derive (vidyut, analysis, slp1Form, options = {}) {
  const { dhatuIndex, wordsMap, itemId } = options

  // Handle NEG: strip it, derive base, prepend a-/an-
  const hasNeg = /\bNEG\b/.test(analysis)
  if (hasNeg) {
    const cleanAnalysis = analysis.replace(/\s*\bNEG\b/, '')
    const baseResult = deriveCore(vidyut, cleanAnalysis, slp1Form, dhatuIndex, wordsMap, itemId)
    if (!baseResult) return null
    const isVowel = /^[aAiIuUfFxXeEoO]/.test(baseResult.text)
    const negated = (isVowel ? 'an' : 'a') + baseResult.text
    return makeResult(baseResult.steps, negated, slp1Form)
  }

  return deriveCore(vidyut, analysis, slp1Form, dhatuIndex, wordsMap, itemId)
}

function deriveCore (vidyut, analysis, slp1Form, dhatuIndex, wordsMap, itemId) {
  try {
    const parts = analysis.split(' ')

    // Extract Case.Gender.Number
    let linga = null; let vacana = null; let vibhakti = null
    const cgnPart = parts.find(p => /^(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.[MFN]\.[SDP]$/.test(p))
    if (cgnPart) {
      const [c, g, n] = cgnPart.split('.')
      vibhakti = CASE_MAP[c]
      linga = GENDER_MAP[g]
      vacana = NUMBER_MAP[n]
    }

    // Extract TAD, STRI suffixes
    const tadPart = parts.find(p => p.startsWith('TAD.'))
    const tadSuffixes = tadPart ? tadPart.replace('TAD.', '').split('.') : null

    const striPart = parts.find(p => p.startsWith('STRI.'))

    // --- DHATU entries ---
    if (parts[0].startsWith('DHATU.')) {
      const dhatuStr = parts[0].replace(/\.$/, '')
      const dhatuParts = dhatuStr.split('.')
      let root = dhatuParts[1]
      let gana = dhatuParts.length > 2 ? (GANA_NUM_MAP[dhatuParts[2]] || dhatuParts[2]) : null

      // Parse upasarga prefix: A-hana~ → upasargas=['A'], root='hana~'
      const segments = root.split('-')
      const upasargas = segments.slice(0, -1)
      root = segments[segments.length - 1]

      // Gana fallback
      if (!gana) {
        if (wordsMap) {
          const wordEntry = wordsMap[slp1Form]?.[itemId] ?? wordsMap[slp1Form]?.['*']
          gana = wordEntry?.gana || 'Bhvadi'
        } else {
          gana = 'Bhvadi'
        }
      }

      const krtPart = parts.find(p => p.startsWith('KRT.'))
      const tinPart = parts.find(p => p.startsWith('TIN.'))

      // DHATU + TIN → tinanta
      if (tinPart) {
        const tinParts = tinPart.split('.')
        const lakara = LAKARA_MAP[tinParts[1]] || tinParts[1]
        const purusha = PURUSHA_MAP[tinParts[2]]
        const tinVacana = NUMBER_MAP[tinParts[3]]
        return deriveTinanta(vidyut, slp1Form, root, gana, lakara, tinVacana, purusha, upasargas, dhatuIndex)
      }

      // DHATU + KRT
      if (krtPart) {
        const krtParts = krtPart.split('.')
        let pratyaya = krtParts[krtParts.length - 1]
        if (pratyaya === 'lyap') pratyaya = 'ktvA'
        const sanadi = krtParts.length > 2 ? krtParts.slice(1, -1) : []

        const aupadeshikaForms = resolveAupadeshika(dhatuIndex, root)
        let fallback = null

        for (const aupa of aupadeshikaForms) {
          if (!aupa || aupa.length === 0 || aupa.length > 20) continue

          for (const tryGana of ganasToTry(gana)) {
            try {
              const dhatu = createDhatu(aupa, tryGana, sanadi, upasargas)

              // DHATU + KRT + TAD
              if (tadSuffixes) {
                const krdResults = deriveKrdantaStems(vidyut, dhatu, pratyaya, upasargas)
                for (const kr of krdResults) {
                  const tadResult = deriveTaddhitaChain(
                    vidyut, kr.text, tadSuffixes, kr.history,
                    linga, vacana, vibhakti, slp1Form,
                  )
                  if (tadResult && tadResult.match) return tadResult
                  if (tadResult && !fallback) fallback = tadResult
                }
                continue
              }

              // DHATU + KRT + STRI
              if (striPart) {
                const result = deriveStriSubanta(vidyut, slp1Form, dhatu, pratyaya, linga, vacana, vibhakti)
                if (result && result.match) return result
                if (result && !fallback) fallback = result
                continue
              }

              // DHATU + KRT + case → subanta
              if (linga && vacana && vibhakti) {
                const result = deriveSubanta(vidyut, slp1Form, dhatu, pratyaya, sanadi, upasargas, linga, vacana, vibhakti)
                if (result && result.match) return result
                if (result && !fallback) fallback = result
                continue
              }

              // DHATU + KRT only → stem derivation
              const krdResults = deriveKrdantaStems(vidyut, dhatu, pratyaya, upasargas)
              for (const r of krdResults) {
                const res = makeResult(r.history, r.text, slp1Form)
                if (res.match) return res
                if (!fallback) fallback = res
              }
            } catch (_) { /* try next gana */ }
          }
        }

        return fallback
      }
    }

    // --- MW/PRON entries ---
    if (parts[0].startsWith('MW.') || parts[0].startsWith('PRON.')) {
      const mwParts = parts[0].split('.')
      // Strip hyphens: MW.A-dA → stem 'AdA'
      const aupadeshika = mwParts[1].replace(/-/g, '')

      // MW/PRON + TAD
      if (tadSuffixes) {
        return deriveTaddhitaChain(vidyut, aupadeshika, tadSuffixes, [], linga, vacana, vibhakti, slp1Form)
      }

      // MW/PRON + case → basic subanta
      if (linga && vacana && vibhakti) {
        // nyāp feminine: stems ending in A/I/U with feminine gender
        const cgnShort = cgnPart?.split('.')[1]
        if (cgnShort === 'F' && (aupadeshika.endsWith('A') || aupadeshika.endsWith('I') || aupadeshika.endsWith('U'))) {
          let fallback = null
          // Try nyap pratipadika first
          try {
            const results = vidyut.deriveSubantas({
              pratipadika: { nyap: aupadeshika }, linga, vacana, vibhakti,
            })
            for (const r of results) {
              if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
              if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
            }
          } catch (_) { /* fall through to basic */ }
          // Also try basic pratipadika
          try {
            const results = vidyut.deriveSubantas({
              pratipadika: { basic: aupadeshika }, linga, vacana, vibhakti,
            })
            for (const r of results) {
              if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
              if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
            }
          } catch (_) { /* no results */ }
          return fallback
        }
        // Standard basic pratipadika
        const dhatu = { aupadeshika, gana: null, antargana: null, sanadi: [], prefixes: [] }
        return deriveSubanta(vidyut, slp1Form, dhatu, null, [], [], linga, vacana, vibhakti)
      }
    }

    return null
  } catch (e) {
    return null
  }
}
