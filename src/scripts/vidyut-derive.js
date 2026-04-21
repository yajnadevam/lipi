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

// Valid BaseKrt pratyaya values (from vidyut WASM enum)
const VALID_KRT = new Set([
  'a', 'aN', 'ac', 'aR', 'aDyE', 'aDyEn', 'atfn', 'aTuc', 'ani', 'anIyar', 'ap', 'ase', 'asen',
  'Aluc', 'Aru', 'ika', 'ikavaka', 'iY', 'itra', 'in_', 'ini', 'izRuc', 'u', 'ukaY', 'Uka',
  'ka', 'kaY', 'kaDyE', 'kaDyEn', 'kamul', 'kasun', 'kap', 'kase', 'kasen', 'kAnac', 'ki', 'kin',
  'kurac', 'kelimar', 'kta', 'ktavatu', 'ktic', 'ktin', 'ktri', 'ktvA', 'knu', 'kmarac', 'kyap',
  'kru', 'krukan', 'klukan', 'kvanip', 'kvarap', 'kvasu', 'ksnu', 'kvin', 'kvip',
  'Kac', 'KaS', 'Kal', 'KizRuc', 'KukaY', 'Kyun', 'Ga', 'GaY', 'GinuR', 'Gurac', 'Nvanip',
  'cAnaS', 'Yyuw', 'wa', 'wak', 'qa', 'qara', 'qu', 'Ra', 'Ramul', 'Rini', 'Ryat', 'Ryuw',
  'Rvi', 'Rvuc', 'Rvul', 'taveN', 'taven', 'tavE', 'tavya', 'tavyat', 'tumun', 'tfc', 'tfn',
  'tosun', 'Takan', 'naN', 'najiN', 'nan', 'ni', 'manin', 'ya', 'yat', 'yuc', 'ra', 'ru',
  'lyu', 'lyuw', 'vanip', 'varac', 'vic', 'viw', 'vuY', 'vun', 'zAkan', 'zwran', 'zvun',
  'Sa', 'Satf', 'SaDyE', 'SaDyEn', 'SAnac', 'SAnan', 'se', 'sen',
])

// Valid Taddhita pratyaya values (from vidyut WASM enum)
const VALID_TAD = new Set([
  'a', 'akac', 'ac', 'aWac', 'aR', 'aY', 'at', 'atasuc', 'anic', 'ap', 'asic', 'astAti',
  'Akinic', 'Arak', 'iY', 'itac', 'inac', 'ini', 'imanic', 'ila', 'ilac', 'izWan',
  'Ikak', 'Ikan', 'Iyasun', 'eRya', 'Erak', 'ka', 'kak', 'kawac', 'kan', 'kap', 'kalpap',
  'kftvasuc', 'kuwArac', 'kuRap', 'Ka', 'KaY', 'Ga', 'Gac', 'Gan', 'Gas', 'caRap', 'caraw',
  'cuYcup', 'cPaY', 'cvi', 'Ca', 'CaR', 'Cas', 'jAtIyar', 'jAhac', 'Ya', 'YiWa', 'Yya',
  'YyaN', 'Yyaw', 'wac', 'waq', 'wiWan', 'wIwac', 'weRyaR', 'wyaR', 'wyu', 'wyul', 'wlaY',
  'Wak', 'Wac', 'WaY', 'Wan', 'Wap', 'qaw', 'qati', 'qatarac', 'qatamac', 'qupac', 'qmatup',
  'qyaR', 'qvalac', 'qvun', 'Qak', 'QakaY', 'Qa', 'QaY', 'Qinuk', 'Qrak', 'Ra', 'Rini',
  'Rya', 'tamap', 'tayap', 'tarap', 'tal', 'tasi', 'tasil', 'ti', 'tikan', 'tIya', 'tyak',
  'tyakan', 'tyap', 'tyu', 'tyul', 'tral', 'trA', 'tva', 'Tamu', 'Tyan', 'TAl', 'daGnac',
  'dA', 'dAnIm', 'deSya', 'deSIyar', 'dvayasac', 'DA', 'na', 'naY', 'nAwac', 'Pak', 'PaY',
  'PiY', 'bahuc', 'biqac', 'birIsac', 'Baktal', 'Brawac', 'ma', 'matup', 'map', 'mayaw',
  'mAtrac', 'pASap', 'piwac', 'ya', 'yak', 'yaY', 'yat', 'yan', 'yus', 'ra', 'rUpap', 'rhil',
  'rUpya', 'lac', 'vati', 'vatup', 'vaya', 'valac', 'vini', 'viDal', 'vuk', 'vuY', 'vun',
  'vyat', 'vyan', 'Sa', 'SaNkawac', 'SAlac', 'Sas', 'za', 'zkan', 'zwarac', 'zWac', 'zWan',
  'zWal', 'zPak', 'zyaN', 'zyaY', 'sa', 'sna', 'sAti', 'suc', 'snaY', 'ha',
])

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

/** Normalize final -s/-r to visarga (-H) for pausa comparison */
function pausaNormalize (s) {
  if (!s) return s
  return s.replace(/[sr]$/, 'H')
}

/** Make a result object */
function makeResult (steps, text, slp1Form) {
  return { steps, text, match: text === slp1Form || pausaNormalize(text) === pausaNormalize(slp1Form) }
}

// --- Derivation sub-routines ---

function deriveTinanta (vidyut, slp1Form, root, gana, lakara, vacana, purusha, upasargas, sanadi, dhatuIndex) {
  const aupadeshikaForms = resolveAupadeshika(dhatuIndex, root)
  let fallback = null

  for (const aupa of aupadeshikaForms) {
    for (const tryGana of ganasToTry(gana)) {
      for (const pada of ['Parasmaipada', 'Atmanepada']) {
        try {
          const dhatu = createDhatu(aupa, tryGana, sanadi, upasargas)
          const results = vidyut.deriveTinantas({
            dhatu,
            lakara,
            vacana,
            purusha,
            prayoga: 'Kartari',
            pada,
            sanadi,
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
  // Validate all taddhita suffixes before any WASM calls
  if (tadSuffixes.some(s => !VALID_TAD.has(s))) return null

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
      // Check all results for a match, not just the first
      for (const r of results) {
        const rm = makeResult(allSteps.concat(r.history), r.text, slp1Form)
        if (rm.match) return rm
      }
      console.warn(`taddhita ${currentStem}+${finalSuffix}: vidyut produced [${results.map(r => r.text).join(', ')}], expected ${slp1Form}`)
      return makeResult(allSteps.concat(results[0].history), results[0].text, slp1Form)
    }
    console.warn(`taddhita ${currentStem}+${finalSuffix}: vidyut returned no results, expected ${slp1Form}`)
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
    //    Skip when sanadi is present — basic pratipadika loses derivation context
    //    (e.g. yaNluk's 8.2.23 exception won't apply, causing false matches)
    if (sanadi && sanadi.length > 0) return fallback
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
  const { dhatuIndex, wordsMap, itemId, type } = options

  // Normalize: strip hyphens from form (upasarga display convention)
  slp1Form = slp1Form.replace(/-/g, '')

  // Handle NEG: strip it, derive base, prepend a-/an-
  const hasNeg = /\bNEG\b/.test(analysis)
  if (hasNeg) {
    const cleanAnalysis = analysis.replace(/\s*\bNEG\b/, '')
    // Strip the negation prefix from slp1Form so the base derivation gets the un-negated form
    let baseForm = slp1Form
    if (slp1Form.startsWith('an') && /^[aAiIuUfFxXeEoO]/.test(slp1Form.slice(2))) {
      baseForm = slp1Form.slice(2)
    } else if (slp1Form.startsWith('a') && !/^[aAiIuUfFxXeEoO]/.test(slp1Form.slice(1))) {
      baseForm = slp1Form.slice(1)
    }
    const baseResult = deriveCore(vidyut, cleanAnalysis, baseForm, dhatuIndex, wordsMap, itemId, type)
    if (!baseResult) return null
    const isVowel = /^[aAiIuUfFxXeEoO]/.test(baseResult.text)
    const negated = (isVowel ? 'an' : 'a') + baseResult.text
    return makeResult(baseResult.steps, negated, slp1Form)
  }

  return deriveCore(vidyut, analysis, slp1Form, dhatuIndex, wordsMap, itemId, type)
}

/** Parse an analysis string into its component parts */
function parseAnalysis (analysis) {
  const parts = analysis.split(' ')

  let linga = null; let vacana = null; let vibhakti = null
  const cgnPart = parts.find(p => /^(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.[MFN]\.[SDP]$/.test(p))
  if (cgnPart) {
    const [c, g, n] = cgnPart.split('.')
    vibhakti = CASE_MAP[c]
    linga = GENDER_MAP[g]
    vacana = NUMBER_MAP[n]
  }

  const tadPart = parts.find(p => p.startsWith('TAD.'))
  const tadSuffixes = tadPart ? tadPart.replace('TAD.', '').split('.') : null
  const striPart = parts.find(p => p.startsWith('STRI.'))
  const krtPart = parts.find(p => p.startsWith('KRT.'))
  const tinPart = parts.find(p => p.startsWith('TIN.'))

  return { parts, linga, vacana, vibhakti, cgnPart, tadSuffixes, striPart, krtPart, tinPart }
}

/** Handle DHATU entries: parse root/gana/upasargas, dispatch to TIN or KRT */
function deriveDhatu (vidyut, slp1Form, parsed, dhatuIndex, wordsMap, itemId) {
  const dhatuStr = parsed.parts[0].replace(/\.$/, '')
  const dhatuParts = dhatuStr.split('.')
  let root = dhatuParts[1]
  let gana = dhatuParts.length > 2 ? (GANA_NUM_MAP[dhatuParts[2]] || dhatuParts[2]) : null

  const segments = root.split('-')
  const upasargas = segments.slice(0, -1)
  root = segments[segments.length - 1]

  if (!gana) {
    if (wordsMap) {
      const wordEntry = wordsMap[slp1Form]?.[itemId] ?? wordsMap[slp1Form]?.['*']
      gana = wordEntry?.gana || 'Bhvadi'
    } else {
      gana = 'Bhvadi'
    }
  }

  if (parsed.tinPart) {
    // TIN[.<sanadi>...].<lakara>.<purusha>.<vacana>
    const tinParts = parsed.tinPart.split('.')
    const vacanaTok = tinParts[tinParts.length - 1]
    const purushaTok = tinParts[tinParts.length - 2]
    const lakaraTok = tinParts[tinParts.length - 3]
    const sanadi = tinParts.slice(1, -3)
    const lakara = LAKARA_MAP[lakaraTok] || lakaraTok
    const purusha = PURUSHA_MAP[purushaTok]
    const tinVacana = NUMBER_MAP[vacanaTok]
    return deriveTinanta(vidyut, slp1Form, root, gana, lakara, tinVacana, purusha, upasargas, sanadi, dhatuIndex)
  }

  if (parsed.krtPart) {
    return deriveDhatuKrt(vidyut, slp1Form, root, gana, upasargas, parsed, dhatuIndex)
  }

  return null
}

/** Try a single dhatu+krt combination, dispatching to the appropriate sub-case */
function tryKrtVariant (vidyut, slp1Form, dhatu, pratyaya, sanadi, upasargas, parsed) {
  const { linga, vacana, vibhakti, tadSuffixes, striPart } = parsed

  if (tadSuffixes) {
    return deriveKrtTaddhita(vidyut, slp1Form, dhatu, pratyaya, upasargas, tadSuffixes, linga, vacana, vibhakti)
  }
  if (striPart) {
    return deriveStriSubanta(vidyut, slp1Form, dhatu, pratyaya, linga, vacana, vibhakti)
  }
  if (linga && vacana && vibhakti) {
    return deriveSubanta(vidyut, slp1Form, dhatu, pratyaya, sanadi, upasargas, linga, vacana, vibhakti)
  }
  // KRT only → stem derivation, return best match
  const krdResults = deriveKrdantaStems(vidyut, dhatu, pratyaya, upasargas)
  let fallback = null
  for (const r of krdResults) {
    const res = makeResult(r.history, r.text, slp1Form)
    if (res.match) return res
    if (!fallback) fallback = res
  }
  return fallback
}

/** Derive krdanta stems then apply taddhita chain, returning best match */
function deriveKrtTaddhita (vidyut, slp1Form, dhatu, pratyaya, upasargas, tadSuffixes, linga, vacana, vibhakti) {
  const krdResults = deriveKrdantaStems(vidyut, dhatu, pratyaya, upasargas)
  let fallback = null
  for (const kr of krdResults) {
    const tadResult = deriveTaddhitaChain(
      vidyut, kr.text, tadSuffixes, kr.history,
      linga, vacana, vibhakti, slp1Form,
    )
    if (tadResult && tadResult.match) return tadResult
    if (tadResult && !fallback) fallback = tadResult
  }
  return fallback
}

/** Handle DHATU+KRT: parse krt, then search aupadeshika × gana combinations */
function deriveDhatuKrt (vidyut, slp1Form, root, gana, upasargas, parsed, dhatuIndex) {
  const krtParts = parsed.krtPart.split('.')
  let pratyaya = krtParts[krtParts.length - 1]
  if (pratyaya === 'lyap') pratyaya = 'ktvA'
  if (!VALID_KRT.has(pratyaya)) return null
  const sanadi = krtParts.length > 2 ? krtParts.slice(1, -1) : []

  const aupadeshikaForms = resolveAupadeshika(dhatuIndex, root)
  let fallback = null

  for (const aupa of aupadeshikaForms) {
    if (!aupa || aupa.length === 0 || aupa.length > 20) continue

    for (const tryGana of ganasToTry(gana)) {
      try {
        const dhatu = createDhatu(aupa, tryGana, sanadi, upasargas)
        const result = tryKrtVariant(vidyut, slp1Form, dhatu, pratyaya, sanadi, upasargas, parsed)
        if (result && result.match) return result
        if (result && !fallback) fallback = result
      } catch (_) { /* try next gana */ }
    }
  }

  return fallback
}

/** Handle MW/PRON entries: dispatch to TAD, feminine, standard subanta, or stem probe */
function deriveMwPron (vidyut, slp1Form, parsed, type) {
  const { linga, vacana, vibhakti, cgnPart, tadSuffixes } = parsed
  const mwParts = parsed.parts[0].split('.')
  const aupadeshika = mwParts[1].replace(/-/g, '')

  if (tadSuffixes) {
    return deriveTaddhitaChain(vidyut, aupadeshika, tadSuffixes, [], linga, vacana, vibhakti, slp1Form)
  }

  if (parsed.striPart) {
    try {
      const results = vidyut.deriveStryantas({ basic: aupadeshika })
      let fallback = null
      for (const r of (results || [])) {
        const rm = makeResult(r.history, r.text, slp1Form)
        if (rm.match) return rm
        if (!fallback) fallback = rm
      }
      return fallback
    } catch (_) { /* stryantas failed */ }
    return null
  }

  if (linga && vacana && vibhakti) {
    const cgnShort = cgnPart?.split('.')[1]
    if (cgnShort === 'F' && (aupadeshika.endsWith('A') || aupadeshika.endsWith('I') || aupadeshika.endsWith('U'))) {
      return deriveFeminineSubanta(vidyut, slp1Form, aupadeshika, linga, vacana, vibhakti)
    }
    const dhatu = { aupadeshika, gana: null, antargana: null, sanadi: [], prefixes: [] }
    return deriveSubanta(vidyut, slp1Form, dhatu, null, [], [], linga, vacana, vibhakti)
  }

  return stemProbe(vidyut, slp1Form, aupadeshika, type)
}

/** Decline a feminine stem using nyāp pratipadika with basic fallback */
function deriveFeminineSubanta (vidyut, slp1Form, aupadeshika, linga, vacana, vibhakti) {
  let fallback = null
  try {
    const results = vidyut.deriveSubantas({
      pratipadika: { nyap: aupadeshika }, linga, vacana, vibhakti,
    })
    for (const r of results) {
      if (r.text === slp1Form) return makeResult(r.history, r.text, slp1Form)
      if (!fallback) fallback = makeResult(r.history, r.text, slp1Form)
    }
  } catch (_) { /* fall through to basic */ }
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

/** Validate consonant-ending MW/PRON stems by probing declension */
function stemProbe (vidyut, slp1Form, aupadeshika, type) {
  if (type !== 'stem' || /[aAiIuUfFxXeEoO]$/.test(aupadeshika)) return null
  for (const probeLinga of ['Pum', 'Napumsaka', 'Stri']) {
    try {
      const results = vidyut.deriveSubantas({
        pratipadika: { basic: aupadeshika },
        linga: probeLinga,
        vacana: 'Eka',
        vibhakti: 'Prathama',
      })
      if (results && results.length > 0) {
        return { steps: results[0].history, text: slp1Form, match: true }
      }
    } catch (_) { /* try next gender */ }
  }
  return null
}

function deriveCore (vidyut, analysis, slp1Form, dhatuIndex, wordsMap, itemId, type) {
  try {
    const parsed = parseAnalysis(analysis)
    if (parsed.parts[0].startsWith('DHATU.')) {
      return deriveDhatu(vidyut, slp1Form, parsed, dhatuIndex, wordsMap, itemId)
    }
    if (parsed.parts[0].startsWith('MW.') || parsed.parts[0].startsWith('PRON.')) {
      return deriveMwPron(vidyut, slp1Form, parsed, type)
    }
    return null
  } catch (e) {
    return null
  }
}
