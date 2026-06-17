<template>
  <!--Header-->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-layout>
    <v-main>
      <!-- Filter bar: alphabet phonemes + ranges + sign-number search -->
      <div class="filter-bar">
        <div class="filter-row">
          <span class="filter-label">Alphabet</span>
          <button
            v-for="p in phonemes"
            :key="p"
            class="chip"
            :class="{ active: selectedPhonemes.includes(p) }"
            @click="onChipClick('phoneme', p)"
            @dblclick="onChipDblClick('phoneme', p)"
          >
            {{ p }}
          </button>
        </div>
        <div class="filter-row">
          <span class="filter-label">Ranges</span>
          <button
            v-for="r in ranges"
            :key="r.start"
            class="chip chip-range"
            :class="{ active: selectedRanges.includes(r.start) }"
            :title="`${r.start}–${r.endLabel}`"
            @click="onChipClick('range', r.start)"
            @dblclick="onChipDblClick('range', r.start)"
          >
            <span
              class="indus-symbol chip-glyph"
              :class="{ 'wide-glyph': r.start === '697' }"
              >{{ r.glyph }}</span
            >
          </button>
          <button
            v-if="selectedPhonemes.length || selectedRanges.length || signSearch"
            class="chip chip-clear"
            @click="clearFilters"
          >
            clear filters
          </button>
        </div>
        <div class="filter-row">
          <span class="filter-label">Search</span>
          <input
            type="search"
            v-model="signSearch"
            placeholder="e.g. 123, 0.., [12].."
            class="search-input"
            spellcheck="false"
            autocomplete="off"
          />
          <span v-if="signSearch && !signSearchValid" class="search-error">
            invalid pattern
          </span>
        </div>
      </div>

      <!-- Clipboard tray: collects glyphs on single click; Search button
           navigates to the inscription view with the collected glyphs as
           the search term. Double-click or shift-click on a glyph bypasses
           the tray and goes straight to an exact `glyph:` search. -->
      <div class="tray">
        <span class="tray-label">Clipboard</span>
        <span class="indus-symbol tray-content">{{ clipboardBuffer }}</span>
        <span v-if="!clipboardBuffer" class="tray-hint"
          >click glyphs to append · double-click to search exact</span
        >
        <v-spacer />
        <span v-if="copied" class="tray-copied">copied ✓</span>
        <button
          v-if="clipboardBuffer"
          class="chip chip-search"
          title="Search inscriptions for these glyphs"
          @click="searchClipboard"
        >
          search ↗
        </button>
        <button
          v-if="clipboardBuffer"
          class="chip"
          @click="backspaceClipboard"
        >
          ⌫
        </button>
        <button
          v-if="clipboardBuffer"
          class="chip chip-clear"
          @click="clearClipboard"
        >
          clear
        </button>
      </div>

      <div class="glyph-wall">
        <button
          v-for="sign in visibleSigns"
          :key="sign.sign"
          class="glyph-cell"
          :title="`${sign.sign}  ·  ${sign.xlit || '?'}  ·  canonical ${sign.canonical}  ·  freq ${frequency[sign.sign] ?? 0}  ·  click to append  ·  shift-click or double-click for exact glyph: search`"
          @click="onGlyphClick(sign.characterizedSign, $event)"
          @dblclick="onGlyphDblClick(sign.characterizedSign)"
        >
          <span v-if="sign.xlit" class="glyph-xlit">{{ sign.xlit }}</span>
          <span class="indus-symbol glyph-symbol">{{
            sign.characterizedSign
          }}</span>
          <span class="glyph-meta">
            {{ sign.sign }} · {{ frequency[sign.sign] ?? 0 }}
          </span>
        </button>
        <div v-if="visibleSigns.length === 0" class="empty-state">
          No glyphs match the selected filters.
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { useTheme } from "vuetify";
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";
</script>

<script>
import { ref } from "vue";
import { csv2json } from "json-2-csv";
import xlits from "../assets/data/xlits.csv?raw";
import frequency from "../assets/data/symbol-frequency.json";
import HeaderLinks from "../components/HeaderLinks.vue";

// Fixed Sanskrit phoneme alphabet for the selector bar.
const PHONEMES = [
  "a", "aa", "i", "u", "k", "c", "j", "t", "d",
  "n", "p", "b", "m", "y", "r", "l", "v", "s",
];

// Range boundaries: each range starts at the given sign and ends at the
// sign preceding the next start. The chip icon is the first glyph of the range.
const RANGE_STARTS = [
  "001", "060", "090", "165", "275", "315", "340", "365", "435", "455",
  "465", "530", "570", "645", "697", "790", "849", "890", "944",
];

// Parse with the real column names so xlit and canonical are correct.
const rows = csv2json(xlits, {
  keys: ["sign", "xlit", "canonical", "regex"],
}).map((v) => ({
  ...v,
  sign: v.sign.toString(),
  canonical: v.canonical != null ? v.canonical.toString() : "",
}));

const xlitmap = {};
rows.forEach((r) => (xlitmap[r.sign] = r));

// Resolve a sign's xlit, following indirections: an empty xlit inherits from
// its canonical (single pointer) or concatenates a composite canonical's parts.
function resolveXlit(sign, depth = 0) {
  const e = xlitmap[sign];
  if (!e || depth > 8) return "";
  if (e.xlit) return e.xlit;
  const canon = e.canonical;
  if (!canon || canon === sign) return "";
  if (canon.includes("-")) {
    // Composite canonical reads right-to-left, same as filter.js's mkregex.
    return canon
      .split("-")
      .reverse()
      .map((c) => resolveXlit(c, depth + 1))
      .join("");
  }
  return resolveXlit(canon, depth + 1);
}

function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

const signs = ref(
  rows
    .filter((v) => ["000", "999"].indexOf(v.sign) === -1)
    .map((v) => ({
      sign: v.sign,
      canonical: v.canonical,
      num: parseInt(v.sign, 10),
      xlit: resolveXlit(v.sign),
      characterizedSign: characterize(v.sign),
    }))
);

const ranges = RANGE_STARTS.map((start, i) => {
  const startNum = parseInt(start, 10);
  const next = RANGE_STARTS[i + 1];
  const endNum = next ? parseInt(next, 10) - 1 : 9998;
  return {
    start,
    startNum,
    endNum,
    endLabel: next ? String(parseInt(next, 10) - 1) : "end",
    glyph: characterize(start),
  };
});

export default {
  components: { HeaderLinks },
  data() {
    return {
      signs,
      frequency,
      phonemes: PHONEMES,
      ranges,
      selectedPhonemes: [],
      selectedRanges: [],
      signSearch: "",
      clipboardBuffer: "",
      copied: false,
    };
  },
  computed: {
    // Compile the search input into an anchored regex. Returns null if the
    // field is empty; throws via try/catch is caught and surfaces a flag.
    signSearchRegex() {
      const term = (this.signSearch || "").trim();
      if (!term) return null;
      try {
        return new RegExp(`^(?:${term})$`);
      } catch (e) {
        return false;
      }
    },
    signSearchValid() {
      return this.signSearchRegex !== false;
    },
    visibleSigns() {
      const phon = this.selectedPhonemes;
      const rngs = this.selectedRanges;
      const activeRanges = this.ranges.filter((r) => rngs.includes(r.start));
      const re = this.signSearchRegex;
      // Invalid regex → match nothing so the user sees their error clearly.
      if (re === false) return [];
      return this.signs.filter((s) => {
        // Sign-number search: full-string regex against the sign id.
        if (re && !re.test(s.sign)) return false;
        // Alphabet facet: substring match against any selected phoneme (OR).
        // The bare inherent vowel 'a' is special-cased: it appears in nearly
        // every reading as a connector, so substring is meaningless. Match it
        // only against glyphs whose xlit is purely 'a' (a, aa, ...).
        if (phon.length) {
          const x = s.xlit || "";
          const matched = phon.some((p) =>
            p === "a" ? /^a+$/.test(x) : x.includes(p)
          );
          if (!matched) return false;
        }
        // Range facet: sign number falls in any selected range (OR).
        if (activeRanges.length) {
          if (!activeRanges.some((r) => s.num >= r.startNum && s.num <= r.endNum))
            return false;
        }
        return true;
      });
    },
  },
  watch: {
    visibleSigns() {
      this.fitGlyphs();
    },
  },
  methods: {
    // Scale down any glyph wider than its cell so wide signs (e.g. 123, 697)
    // aren't clipped. scaleX preserves height; only over-wide glyphs shrink.
    fitGlyphs() {
      this.$nextTick(() => {
        const cells = document.querySelectorAll(".glyph-cell");
        cells.forEach((cell) => {
          const g = cell.querySelector(".glyph-symbol");
          if (!g) return;
          g.style.transform = "";
          g.style.display = "inline-block";
          const avail = cell.clientWidth - 4;
          const natural = g.offsetWidth;
          if (natural > avail && natural > 0) {
            g.style.transform = `scaleX(${(avail / natural).toFixed(3)})`;
            g.style.transformOrigin = "center";
          }
        });
      });
    },
    onResize() {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.fitGlyphs(), 150);
    },
    // Chip selection model: single click/tap = radio (replace selection across
    // both alphabet + ranges with just this chip; clicking the only-selected
    // chip again deselects it). Double click / double tap = add-to-selection
    // (toggle this chip in or out without disturbing the rest). The single-
    // click action is deferred ~250 ms so a follow-up dblclick can cancel it.
    onChipClick(kind, value) {
      clearTimeout(this._chipTimer);
      this._chipTimer = setTimeout(() => {
        this.replaceSelection(kind, value);
        this._chipTimer = null;
      }, 250);
    },
    onChipDblClick(kind, value) {
      clearTimeout(this._chipTimer);
      this._chipTimer = null;
      this.toggleChipInPlace(kind, value);
    },
    toggleChipInPlace(kind, value) {
      const list = kind === "phoneme" ? this.selectedPhonemes : this.selectedRanges;
      const i = list.indexOf(value);
      if (i === -1) list.push(value);
      else list.splice(i, 1);
    },
    replaceSelection(kind, value) {
      const totalSelected = this.selectedPhonemes.length + this.selectedRanges.length;
      const onlyThis =
        totalSelected === 1 &&
        (kind === "phoneme"
          ? this.selectedPhonemes[0] === value
          : this.selectedRanges[0] === value);
      if (onlyThis) {
        this.selectedPhonemes = [];
        this.selectedRanges = [];
      } else {
        this.selectedPhonemes = kind === "phoneme" ? [value] : [];
        this.selectedRanges = kind === "range" ? [value] : [];
      }
    },
    clearFilters() {
      this.selectedPhonemes = [];
      this.selectedRanges = [];
      this.signSearch = "";
    },
    // Single click on a glyph appends it to the clipboard (collect-multiple).
    // Shift-click or double-click skips the tray and goes straight to an
    // exact `glyph:<char>` search on the inscription view. The plain-click
    // append is deferred ~250 ms so a follow-up dblclick can cancel it and
    // we don't leave stray chars in the buffer.
    onGlyphClick(characterizedSign, event) {
      clearTimeout(this._glyphTimer);
      if (event && event.shiftKey) {
        this.navigateGlyphSearch(characterizedSign);
        return;
      }
      this._glyphTimer = setTimeout(() => {
        this.appendToClipboard(characterizedSign);
        this._glyphTimer = null;
      }, 250);
    },
    onGlyphDblClick(characterizedSign) {
      clearTimeout(this._glyphTimer);
      this._glyphTimer = null;
      this.navigateGlyphSearch(characterizedSign);
    },
    navigateGlyphSearch(characterizedSign) {
      this.$router.push({
        path: "/",
        query: { search: `glyph:${characterizedSign}` },
      });
    },
    appendToClipboard(characterizedSign) {
      this.clipboardBuffer += characterizedSign;
      this.writeClipboard();
    },
    searchClipboard() {
      if (!this.clipboardBuffer) return;
      this.$router.push({
        path: "/",
        query: { search: this.clipboardBuffer },
      });
    },
    backspaceClipboard() {
      this.clipboardBuffer = Array.from(this.clipboardBuffer).slice(0, -1).join("");
      this.writeClipboard();
    },
    clearClipboard() {
      this.clipboardBuffer = "";
      this.copied = false;
    },
    writeClipboard() {
      if (navigator.clipboard && this.clipboardBuffer) {
        navigator.clipboard
          .writeText(this.clipboardBuffer)
          .then(() => {
            this.copied = true;
          })
          .catch(() => {
            // writeText can reject without a trusted user gesture; buffer is
            // still the source of truth, so just leave the copied flag unset.
            this.copied = false;
          });
      }
    },
  },
  mounted() {
    this.fitGlyphs();
    // Re-measure once the Indus font loads; fallback metrics differ.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => this.fitGlyphs());
    }
    window.addEventListener("resize", this.onResize);
    // Todo: This should probably moved to a common location since its used across pages
    setTimeout(function () {
      const splashScreen = document.querySelector(".splash");
      if (splashScreen) splashScreen.classList.add("hidden");
    }, 100);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
    clearTimeout(this._resizeTimer);
    clearTimeout(this._chipTimer);
    clearTimeout(this._glyphTimer);
  },
};
</script>

<style>
@font-face {
  font-family: "indus_scriptregular";
  src: url("../assets/fonts/indus-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-size: 24pt;
  font-display: swap;
}
.indus {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
  white-space: pre;
}
.indus-symbol {
  font-family: indus_scriptregular;
  /* Scales with viewport but never collapses below a legible/tappable floor. */
  font-size: clamp(28px, 4.2vmin, 44px);
  line-height: 1;
  font-display: swap;
  white-space: pre;
  cursor: pointer;
}
/* Sign 697 is unusually wide; squeeze it horizontally to fit a grid cell. */
.wide-glyph {
  display: inline-block;
  transform: scaleX(0.5);
  transform-origin: center;
}
.sanskrit {
  white-space: pre;
}
.random {
  white-space: pre;
  color: orange;
}
.v-text-field input {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
}

/* Filter bar */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 4px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.filter-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
  width: 64px;
  flex: none;
}
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid rgba(127, 127, 127, 0.4);
  border-radius: 16px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.chip:hover {
  border-color: rgba(127, 127, 127, 0.8);
  background: rgba(127, 127, 127, 0.12);
}
.chip.active {
  border-color: currentColor;
  background: rgba(127, 127, 127, 0.28);
  font-weight: 600;
}
.chip-range {
  padding: 0 6px;
  overflow: hidden;
}
.chip-glyph {
  font-size: 20px;
  cursor: pointer;
}
.chip-clear {
  font-size: 12px;
  opacity: 0.75;
}
.search-input {
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(127, 127, 127, 0.4);
  border-radius: 16px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  min-width: 160px;
}
.search-input:focus {
  outline: none;
  border-color: currentColor;
}
.search-error {
  font-size: 11px;
  color: #e57373;
  opacity: 0.9;
}

/* Clipboard tray */
.tray {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 8px 0;
  padding: 6px 10px;
  border: 1px solid rgba(127, 127, 127, 0.3);
  border-radius: 8px;
  min-height: 44px;
}
.tray-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
  flex: none;
}
.tray-content {
  font-size: 28px;
  cursor: default;
  overflow-x: auto;
  white-space: nowrap;
}
.tray-hint {
  font-size: 12px;
  opacity: 0.45;
}
.tray-copied {
  font-size: 12px;
  color: #4caf50;
}
.chip-search {
  border-color: currentColor;
  font-weight: 600;
}

/* Option A: dense reflow grid.
   auto-fill keeps cell size constant and changes the column COUNT on resize.
   clamp() floors the cell so it shrinks toward fitting more on wide screens
   but never drops below a legible/tappable ~48px. */
.glyph-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(48px, 6vmin, 72px), 1fr));
  gap: 4px;
  padding: 8px;
  align-content: start;
}
.glyph-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 2px;
  min-height: 48px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
}
.glyph-cell:hover {
  border-color: rgba(127, 127, 127, 0.5);
  background: rgba(127, 127, 127, 0.12);
}
/* Resolved xlit, shown horizontally above the glyph. */
.glyph-xlit {
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.5px;
  opacity: 0.65;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.glyph-meta {
  font-size: 9px;
  line-height: 1;
  opacity: 0.6;
  white-space: nowrap;
}
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  opacity: 0.6;
}
.v-toolbar-title {
  overflow: visible !important;
}
</style>
