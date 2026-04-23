import fs from 'fs';
import { parse } from 'csv-parse';

import Sanscript from "@indic-transliteration/sanscript";
import dhatudata from './assets/data.json'
import dhatuforms from './assets/dhatuforms_vidyut_shuddha_krut.json';
import kartariforms from './assets/dhatuforms_vidyut_shuddha_kartari.json'
import path from 'path';

const DEVANAGARI = 'devanagari'
const SLP1 = 'slp1'

const ADDITIONAL_WORDS = ['asmad']

// Metadata / invisible tags — stripped together with any content.
// These carry indexing info, page/column refs, or editorial markers that
// should never appear in a reader-facing rendering.
const INVISIBLE_TAGS = [
    'info', 'listinfo', 'hwtype', 'vlex', 'srs', 'shortlong',
    'pb', 'pc', 'pcol', 'lbinfo', 'mark', 'edit', 'root',
    'sic', 'C', 'P', 'H', 'note', 'pic', 'br', 'lb',
]

// Semantic tags — content preserved, tag and attributes dropped.
// Order within the list doesn't matter; we apply a single regex pass at the end.
const TRANSPARENT_TAGS = [
    'ls', 'lex', 'hom', 'lang', 'etym', 'i', 'b', 'gk', 'heb', 'arab',
    'rus', 'mong', 'tib', 'fr', 'ger', 'ed', 'ms', 'lat', 'toch', 'iw',
    'div', 'span', 'bot', 'bio', 'zoo', 'old', 'new', 'chg', 'ns', 'nsi',
    'is', 'cl', 'type', 'per', 'F', 'VN', 'alt', 'sup', 'Poem', 'symbol',
]

function stripTagAndContent(text: string, tag: string): string {
    // Handle self-closing (<tag/>, <tag ... />) and paired (<tag>...</tag>,
    // <tag ...>...</tag>) forms. Non-greedy so nested identical tags don't collapse.
    const selfClose = new RegExp(`<${tag}(\\s[^>]*)?/>`, 'g')
    const paired = new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'g')
    return text.replace(selfClose, '').replace(paired, '')
}

function unwrapTag(text: string, tag: string): string {
    // Keep inner text, drop the tag and any attributes. Applied after metadata
    // stripping so attribute clutter (e.g. class/n) doesn't leak through.
    const paired = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g')
    return text.replace(paired, '$1')
}

function renderBody(raw: string): string {
    let body = raw

    // 1. Strip metadata tags entirely (including any text content).
    for (const tag of INVISIBLE_TAGS) {
        body = stripTagAndContent(body, tag)
    }

    // 2. Transliterate <s>X</s> SLP1 → Devanagari. Any residual inner tags
    //    (already rare after step 1) are stripped before transliteration so
    //    no markup bleeds into Sanscript input.
    body = body.replace(/<s>([\s\S]*?)<\/s>/g, (_m, content) => {
        const cleaned = content.replace(/<[^>]+>/g, '').replace(/\//g, '')
        return Sanscript.t(cleaned, SLP1, DEVANAGARI)
    })

    // 3. Expand <ab n="Full">abbr</ab> and <s1 n="Full">abbr</s1> to the
    //    full form from the n attribute. Cologne uses `n` to hold the
    //    canonical English (ab) or IAST (s1) expansion; preferring it
    //    eliminates ambiguous glyphs like `fr°` that would otherwise be
    //    mis-read as SLP1.
    body = body.replace(
        /<(ab|s1)\s+n\s*=\s*"([^"]*)"[^>]*>[\s\S]*?<\/\1>/g,
        (_m, _tag, full) => full,
    )

    // 4. Unwrap remaining <ab> and <s1> (no n attr) — content is already the
    //    reader-facing form (English abbreviation or IAST proper name).
    body = unwrapTag(body, 'ab')
    body = unwrapTag(body, 's1')

    // 5. Unwrap all other semantic tags, preserving inner content.
    for (const tag of TRANSPARENT_TAGS) {
        body = unwrapTag(body, tag)
    }

    // 6. Safety net for any unlisted or malformed tag that slipped through.
    body = body.replace(/<[^>]+>/g, '')

    // 7. Normalize whitespace and entities.
    body = body.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

    return body
}

function generateMwMap() {
    const mwMap = {}
    const fileContents = fs.readFileSync(path.join(__dirname, 'assets/mw.xml'), 'utf-8').split('\n')
    for(const lineNo in fileContents) {
        const line = fileContents[lineNo]
        const keyMatch = line.match(/<key1>(.*?)<\/key1>/);

        if (keyMatch) {
            const key1 = keyMatch[1];
            const bodyMatch = line.match(/<body>(.*?)<\/body>/);
            const linkMatch = line.match(/<L>(\d+)<\/L>/);

            if(bodyMatch) {
                let bodyContent = renderBody(bodyMatch[1])

                if (linkMatch) {
                    bodyContent += `<L>[ID=${linkMatch[1]}]</L>`
                }

                if(!(key1 in mwMap)) {
                    mwMap[key1] = []
                }
                mwMap[key1].push(bodyContent)
            }
        }
    }
    return mwMap
}

const mwMap = generateMwMap()

async function readCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,             // Use first row as header
                // skip_empty_lines: true,    // Skip blank lines
                relax_column_count: true,  // Tolerate missing or extra columns
                trim: true,                // Trim whitespace
                relax_quotes: true,        // Allows mismatched quotes
                quote: '"',
                escape: '"',               // Escapes double quotes as ""
              }))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

async function getUniqueWords(): Promise<Set<string>> {
    const data: any[] = await readCSV('./src/assets/data/inscriptions.csv')
    const words: Set<string> = new Set()
    for(let i = 0; i < data.length; i++) {
        const sanskritWords = data[i]['sanskrit']?.trim().replaceAll('-', ' ').split(' ')
        if (sanskritWords) {
            for(let j = 0; j < sanskritWords.length; j++) {
                if(sanskritWords[j].startsWith('ref:') || sanskritWords[j].length == 0) continue;
                words.add(sanskritWords[j])
            }            
        }        
    }

    for(let i = 0; i < ADDITIONAL_WORDS.length; i++) {
        words.add(ADDITIONAL_WORDS[i])
    }

    return words
}

function getAllVidyutKrutMatches(devanagariWord: string) {
    let results: object[] = []
    for(const code in dhatuforms) {
        for (const pratyaya in dhatuforms[code]) {
            const prakrutas = dhatuforms[code][pratyaya].split(',')
            const matchIndex = prakrutas.indexOf(devanagariWord)
            if (matchIndex > -1) {
                const dhatu = dhatudata['data'].filter(dhatu => dhatu.baseindex === code)[0]
                const key = {
                    type: 'krdanta',
                    code,
                    pratyaya,
                    form: matchIndex,
                    dhatu: dhatu['dhatu'],
                    index: dhatu['i'],
                    artha: dhatu['artha']
                }
                results.push(key)                
            }
        }
    }
    return results
}

function getAllVidyutKartariMatches(devanagariWord: string) {
    let results: object[] = []
    for(const code in kartariforms) {
        for (const kartari in kartariforms[code]) {
            const prayogas = kartariforms[code][kartari].split(';')
            for (let i = 0; i < prayogas.length; i++) {
                if (prayogas[i].split(',').indexOf(devanagariWord) > -1) {
                    const dhatu = dhatudata['data'].filter(dhatu => dhatu.baseindex === code)[0]
                    const key = {
                        type: 'kartari',
                        code,
                        kartari,
                        form: i,
                        dhatu: dhatu['dhatu'],
                        index: dhatu['i'],
                        artha: dhatu['artha']
                    }
                    results.push(key) 
                }
            }
        }
    }
    return results
}

async function writeFile(filePath: string, data: string) {
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error(`Error writing file: ${filePath}`, err);
        } else {
            console.log(`Successfully wrote file ${filePath}`);
        }
    });
}

function replace(word: string, characters: string[]) {
    for(let i = 0;i < characters.length; i++) {
        word = word.replaceAll(characters[i], '')
    }
    return word
}

// @ts-ignore TS6133
function getPrakriyaMatches(devanagariWord) {
    const krutMatches = getAllVidyutKrutMatches(devanagariWord)
    let krutResults: any[] = []
    if (krutMatches.length > 0) {
        krutResults = krutMatches
    }

    const kartariMatches = getAllVidyutKartariMatches(devanagariWord)
    let kartariResults: any[] = []
    if (kartariMatches.length > 0) {
        kartariResults = kartariMatches
    }
    return krutResults.concat(kartariResults)
}

(async() => {
    const uniqueWords: Set<string> = await getUniqueWords()
    const prakriyaResults: {[key: string]: any} = {}
    const mwResults: {[key: string]: any} = {}
    const unknown: string[] = []
    let count = 0
    for (const word of uniqueWords) {
        const sanitizedWord = replace(word, ['[', ']', '(', ')'])
        const replaceRegex = /(sya|s|m|Aya)$/i
        const declensionRemovedWord = sanitizedWord.replace(replaceRegex, "")

        // If word is already processed then skip
        if (word in prakriyaResults || word in mwResults || unknown.includes(word)) {
            continue
        }
        
        // let res = getPrakriyaMatches(Sanscript.t(sanitizedWord, SLP1, DEVANAGARI))
        // if (res.length === 0) {
        //     // the way i see it, tadditha 2ndary affixes are not easily found and the declensions are not easily found. 
        //     // i think at least for declension, it is a substring, ie if the word ends in /s/, /m/, /sya/ etc, you could clip 
        //     // that off and see if something matches. We could add the tadittas as well, 
        //     // i think its mostly matup (-vat, vān), ini (ī) and a couple of rare ones like tasil. 
        //     // they could probably all be handled similarly
        //     // for example: दमनवतम् is damana + matup + accusative.
        //     res = getPrakriyaMatches(Sanscript.t(declensionRemovedWord, SLP1, DEVANAGARI))
        // }        

        // prakriyaResults[word] = res

        if (sanitizedWord in mwMap) {
            mwResults[word] = mwMap[sanitizedWord]
        } else if (declensionRemovedWord in mwMap) {
            mwResults[word] = mwMap[declensionRemovedWord]
        }
        
        // if (prakriyaResults[word].length == 0 && !(word in mwResults)) {            
        //     unknown.push(word)
        // }

        // if (prakriyaResults[word].length == 0) {
        //     delete prakriyaResults[word]
        // }
        process.stdout.write(`Completed ${(++count / uniqueWords.size * 100).toFixed(2)}% \r`)
    }

    // console.log(`\n\nPrakriyas successfully generated: ${Object.keys(prakriyaResults).length}\nMW Matches: ${Object.keys(mwResults).length}\nUnsuccessful: ${unknown.length}\nTotal: ${uniqueWords.size}\n`)

    // await writeFile('./src/assets/data/prakriyas.json', JSON.stringify(prakriyaResults, null, 2))
    await writeFile('./src/assets/data/mw.json', JSON.stringify(mwResults, null, 2))
    // await writeFile('./src/assets/data/unknown.txt', unknown.join('\n'))    
})()