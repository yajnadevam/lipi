const Sanscript = require("@indic-transliteration/sanscript");
const d = require("../dev-tools/ashtadhyayi/assets/data.json");
const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");

// Build code -> artha_english from data.json
const arthaByCode = {};
for (const e of d.data) {
  arthaByCode[e.baseindex] = e.artha_english;
}

// Build lookup keyed by dhatupatha SLP1 form (with anubandhas)
const lookup = {};
const tsv = readFileSync(resolve(__dirname, "../vidyut-data/prakriya/dhatupatha.tsv"), "utf-8");
for (const line of tsv.trim().split("\n").slice(1)) {
  const [code, dhatu] = line.split("\t");
  const artha = arthaByCode[code];
  if (!artha) continue;
  // Key by dhatupatha form (e.g. RaBa~\)
  if (!lookup[dhatu]) lookup[dhatu] = [];
  lookup[dhatu].push(artha);
  // Also key by form without trailing \ (CSV often omits it)
  const noBackslash = dhatu.replace(/\\$/, "");
  if (noBackslash !== dhatu) {
    if (!lookup[noBackslash]) lookup[noBackslash] = [];
    lookup[noBackslash].push(artha);
  }
}

// Also add clean SLP1 forms from data.json (for dhatus without anubandhas)
for (const e of d.data) {
  const slp1 = Sanscript.t(e.dhatu, "devanagari", "slp1");
  if (!lookup[slp1]) lookup[slp1] = [];
  if (e.artha_english) lookup[slp1].push(e.artha_english);
}

// Test
const testKeys = ["ru", "BA", "Basa~", "RaBa~", "Df", "han", "dA", "mAn", "A-BA"];
for (const k of testKeys) {
  console.log(k, "->", lookup[k] ? lookup[k][0] : "NOT FOUND");
}
console.log("Total keys:", Object.keys(lookup).length);

const outPath = resolve(__dirname, "../src/assets/data/dhatu.json");
writeFileSync(outPath, JSON.stringify(lookup));
console.log("Wrote", outPath);
