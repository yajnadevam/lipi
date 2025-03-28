import fs from 'fs';
import path from 'path'
import csvParser from 'csv-parser';
import Sanscript from "@indic-transliteration/sanscript";
import dhatuforms from './assets/dhatuforms_vidyut_shuddha_krut.json';
import { Vidyut } from './assets/vidyut_prakriya'

const VIDYUT = Vidyut.init(fs.readFileSync(path.join(__dirname, 'assets/vidyut_dhatupatha_5.tsv'), 'utf-8'))
const DEVANAGARI = 'devanagari'
const SLP1 = 'slp1'

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

function getAllMatches(devanagariWord: string) {
    let results: string[] = []
    for(const code in dhatuforms) {
        for (const pratyaya in dhatuforms[code]) {
            const prakrutas = dhatuforms[code][pratyaya].split(',')
            const matchIndex = prakrutas.indexOf(devanagariWord)
            if (matchIndex > -1) {
                const key = `${code}_${pratyaya}_${matchIndex}`
                results.push(key)                
            }
        }
    }
    return results
}

function generateKrdantaInput(code: string, krt: string) {
    return {
        code: code, // example dhatu code
        krt: krt, // BaseKrt
        sanadi: [], // Sanadi is an array of strings
        upasarga: [], // array of strings
        lakara: null, // or something like "Lat" if required
        prayoga: null // or "Kartari", etc.
    }
}

function deriveKrdantas(input: string) {
    const inputParts = input.split('_')
    return VIDYUT.deriveKrdantas(generateKrdantaInput(Sanscript.t(inputParts[0], DEVANAGARI, SLP1), Sanscript.t(inputParts[1], DEVANAGARI, SLP1)))    
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
        const matches = getAllMatches(devanagariWord)
        if (matches.length > 0) {
            results[word] = matches.map((match) => ({key: match, krdantas: deriveKrdantas(match)}))
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