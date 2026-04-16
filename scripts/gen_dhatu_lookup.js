const Sanscript = require("@indic-transliteration/sanscript");
const d = require("../dev-tools/ashtadhyayi/assets/data.json");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const GANA_NAMES = {
  "1": "Bhvadi",
  "2": "Adadi",
  "3": "Juhotyadi",
  "4": "Divadi",
  "5": "Svadi",
  "6": "Tudadi",
  "7": "Rudhadi",
  "8": "Tanadi",
  "9": "Kryadi",
  "10": "Curadi",
};
const GANA_NUMS = {};
for (const [num, name] of Object.entries(GANA_NAMES)) GANA_NUMS[name] = num;

// Build artha_english + gana name by baseindex
const metaByCode = {};
for (const e of d.data) {
  metaByCode[e.baseindex] = {
    artha: e.artha_english,
    ganaName: GANA_NAMES[String(e.gana)],
  };
}

// Generate loose-form variants — glossing.csv may omit some aupadeshika markers.
// `\` and `^` are accent markers commonly dropped; `~` marks the nasal it-letter
// and is more often retained. Emit both partially-stripped (keep `~`) and
// fully-stripped variants.
const looseVariants = (s) => {
  const v = new Set();
  v.add(s.replace(/[\\^]/g, "")); // strip accents only, keep ~
  v.add(s.replace(/[\\^~]/g, "")); // strip everything
  v.delete(s); // canonical handled separately
  return [...v];
};

// Build lookup from dhatupatha.tsv (canonical aupadeshika forms).
// We collect all entries per form key, then emit only when unambiguous.
const lookup = {};
const tsv = readFileSync(
  resolve(__dirname, "../vidyut-data/prakriya/dhatupatha.tsv"),
  "utf-8",
);
const byForm = {}; // form (canonical or loose) → [{ganaName, artha}]
for (const line of tsv.trim().split("\n").slice(1)) {
  const [code, dhatu] = line.split("\t");
  const meta = metaByCode[code];
  if (!meta || !meta.artha || !meta.ganaName) continue;
  const ganaNum = GANA_NUMS[meta.ganaName];
  // Composite key (canonical form + gana name or number) — always emit
  lookup[`${dhatu}.${meta.ganaName}`] = meta.artha;
  if (ganaNum) lookup[`${dhatu}.${ganaNum}`] = meta.artha;
  (byForm[dhatu] = byForm[dhatu] || []).push({ ganaName: meta.ganaName, artha: meta.artha });
  // Composite keys for loose-form variants
  for (const loose of looseVariants(dhatu)) {
    const looseKey = `${loose}.${meta.ganaName}`;
    if (!lookup[looseKey]) lookup[looseKey] = meta.artha;
    if (ganaNum) {
      const looseNumKey = `${loose}.${ganaNum}`;
      if (!lookup[looseNumKey]) lookup[looseNumKey] = meta.artha;
    }
    (byForm[loose] = byForm[loose] || []).push({ ganaName: meta.ganaName, artha: meta.artha });
  }
}

// Emit a bare-form key when all entries for that form share the same gana
// (multiple entries in one gana are still unambiguous for our purposes).
// Skip if entries span multiple ganas — caller must specify the gana.
const sameGana = (entries) => entries.every((e) => e.ganaName === entries[0].ganaName);
for (const [form, entries] of Object.entries(byForm)) {
  if (lookup[form]) continue;
  if (sameGana(entries)) lookup[form] = entries[0].artha;
}

// Merge hand-curated supplement entries for dhātus that exist in dictionary
// sources (MW, etc.) but not in dhatupatha.tsv.
const supplementPath = resolve(__dirname, "dhatu_supplement.json");
if (existsSync(supplementPath)) {
  const supplement = JSON.parse(readFileSync(supplementPath, "utf-8"));
  let added = 0;
  for (const [k, v] of Object.entries(supplement)) {
    if (!lookup[k]) added++;
    lookup[k] = v;
    // Also emit bare-form key (without the gana suffix)
    if (k.includes(".")) {
      const bare = k.substring(0, k.lastIndexOf("."));
      if (!lookup[bare]) lookup[bare] = v;
    }
  }
  console.log(
    `Merged ${Object.keys(supplement).length} supplement entries (${added} new keys)`,
  );
}

// Test
const testKeys = [
  "ru",
  "ru.Adadi",
  "ru\\N.Bhvadi",
  "BU.Bhvadi",
  "maTe~.Bhvadi",
  "maYja~.Curadi",
  "anjU~.Rudhadi",
];
for (const k of testKeys) {
  console.log(k, "->", lookup[k] ? lookup[k].substring(0, 80) : "NOT FOUND");
}
console.log("Total keys:", Object.keys(lookup).length);

const outPath = resolve(__dirname, "../src/assets/data/dhatu.json");
writeFileSync(outPath, JSON.stringify(lookup));
console.log("Wrote", outPath);
