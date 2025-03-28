import fs from 'fs';
import path from 'path'
import csvParser from 'csv-parser';
import Sanscript from "@indic-transliteration/sanscript";
import dhatuforms from './assets/dhatuforms_vidyut_shuddha_krut.json';

const DEVANAGARI = 'devanagari'
const SLP1 = 'slp1'

const dhatudata = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/data.txt'), 'utf-8'))

async function readCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
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

function getAllVidyutMatches(devanagariWord: string) {
    let results: object[] = []
    for(const code in dhatuforms) {
        for (const pratyaya in dhatuforms[code]) {
            const prakrutas = dhatuforms[code][pratyaya].split(',')
            const matchIndex = prakrutas.indexOf(devanagariWord)
            if (matchIndex > -1) {
                const dhatu = dhatudata['data'].filter(dhatu => dhatu.baseindex === code)[0]
                const key = {
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

(async() => {
    const uniqueWords: Set<string> = await getUniqueWords()
    const results: {[key: string]: any} = {}
    const unknown: string[] = []
    let count = 0
    for (const word of uniqueWords) {
        const sanitizedWord = replace(word, ['[', ']', '(', ')'])
        const devanagariWord = Sanscript.t(sanitizedWord, SLP1, DEVANAGARI)
        const matches = getAllVidyutMatches(devanagariWord)
        if (matches.length > 0) {
            results[word] = matches
        } else {
            unknown.push(word)
        }
        process.stdout.write(`Completed ${(++count / uniqueWords.size * 100).toFixed(2)}% \r`)
    }

    console.log(`\n\nPrakriyas successfully generated: ${Object.keys(results).length}\nUnsuccessful: ${unknown.length}\nTotal: ${uniqueWords.size}\n`)

    await writeFile('./src/assets/data/prakriyas.json', JSON.stringify(results, null, 2))
    await writeFile('./src/assets/data/prakriyas-unknown.txt', unknown.join('\n'))    
})()