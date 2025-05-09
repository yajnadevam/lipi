import fs from 'fs';
import { parse } from 'csv-parse';

import Sanscript from "@indic-transliteration/sanscript";
import dhatudata from './assets/data.json'
import dhatuforms from './assets/dhatuforms_vidyut_shuddha_krut.json';
import kartariforms from './assets/dhatuforms_vidyut_shuddha_kartari.json'
import path from 'path';

const DEVANAGARI = 'devanagari'
const SLP1 = 'slp1'
const mwMap = generateMwMap()


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
                let bodyContent = bodyMatch[1].trim();

                // Convert content within <s> tag to Devanagari
                bodyContent = bodyContent.replace(/<s>(.*?)<\/s>/g, (match, content) => {
                    return Sanscript.t(content.replaceAll('/', ''), SLP1, DEVANAGARI);
                });

                // bodyContent = bodyContent.replace(/<[^>]+>/g, '');
                bodyContent = bodyContent.replace(/\s+/g, ' ').trim();
                bodyContent = bodyContent.replaceAll('&amp;', '&')

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
        
        let res = getPrakriyaMatches(Sanscript.t(sanitizedWord, SLP1, DEVANAGARI))
        if (res.length === 0) {
            // the way i see it, tadditha 2ndary affixes are not easily found and the declensions are not easily found. 
            // i think at least for declension, it is a substring, ie if the word ends in /s/, /m/, /sya/ etc, you could clip 
            // that off and see if something matches. We could add the tadittas as well, 
            // i think its mostly matup (-vat, vān), ini (ī) and a couple of rare ones like tasil. 
            // they could probably all be handled similarly
            // for example: दमनवतम् is damana + matup + accusative.
            res = getPrakriyaMatches(Sanscript.t(declensionRemovedWord, SLP1, DEVANAGARI))
        }        

        prakriyaResults[word] = res

        if (sanitizedWord in mwMap) {
            mwResults[word] = mwMap[sanitizedWord]
        } else if (declensionRemovedWord in mwMap) {
            mwResults[word] = mwMap[declensionRemovedWord]
        }
        
        if (prakriyaResults[word].length == 0 && !(word in mwResults)) {            
            unknown.push(word)
        }

        if (prakriyaResults[word].length == 0) {
            delete prakriyaResults[word]
        }
        process.stdout.write(`Completed ${(++count / uniqueWords.size * 100).toFixed(2)}% \r`)
    }

    console.log(`\n\nPrakriyas successfully generated: ${Object.keys(prakriyaResults).length}\nMW Matches: ${Object.keys(mwResults).length}\nUnsuccessful: ${unknown.length}\nTotal: ${uniqueWords.size}\n`)

    await writeFile('./src/assets/data/prakriyas.json', JSON.stringify(prakriyaResults, null, 2))
    await writeFile('./src/assets/data/mw.json', JSON.stringify(mwResults, null, 2))
    await writeFile('./src/assets/data/unknown.txt', unknown.join('\n'))    
})()