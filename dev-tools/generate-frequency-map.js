const fs = require('fs');

const processIndusScript = (data) => {
    const frequencyMap = {};
    const charNext = {};
    const charPrev = {};
    const charWords = {};
    const charCount = {};
    const charNextCount = {};
    const charPrevCount = {};

    data.forEach(entry => {
        let text = entry.text;
        text = text.replace(/\+/g, ""); // Remove all '+'
        text = text.replace(/[\[\]]/g, "/"); // Replace '[' and ']' with word boundary '/'

        const words = text.split('/'); // Split into words using '/'

        words.forEach(word => {
            if (!word.trim()) return; // Ignore empty words

            const chars = word.split('-').map(Number).filter(char => char !== 0 && char !== 999); // Convert to integers and filter out 0 and 999

            chars.forEach((char, i) => {
                charCount[char] = (charCount[char] || 0) + 1;

                if (!charWords[char]) charWords[char] = new Set();
                charWords[char].add(word); // Store full word instead of entry id

                if (i > 0) {
                    const prevChar = chars[i - 1];
                    if (!charPrev[char]) charPrev[char] = [];
                    if (!charPrevCount[char]) charPrevCount[char] = {};
                    
                    charPrev[char].push({ char: prevChar, freq: (charPrevCount[char][prevChar] = (charPrevCount[char][prevChar] || 0) + 1) });
                }
                if (i < chars.length - 1) {
                    const nextChar = chars[i + 1];
                    if (!charNext[char]) charNext[char] = [];
                    if (!charNextCount[char]) charNextCount[char] = {};
                    
                    charNext[char].push({ char: nextChar, freq: (charNextCount[char][nextChar] = (charNextCount[char][nextChar] || 0) + 1) });
                }
            });
        });
    });

    Object.keys(charWords).forEach(char => {
        frequencyMap[Number(char)] = {
            count: charCount[char] || 0,
            before: charPrev[char] || [],
            after: charNext[char] || [],
            words: Array.from(charWords[char] || [])
        };
    });

    return frequencyMap;
};

const inscriptionsjsonFilePath = "./src/assets/data/inscriptions.json";
const outputFilePath = "./src/assets/data/graph.json";

fs.readFile(inscriptionsjsonFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    
    const jsonData = JSON.parse(data);
    const result = processIndusScript(jsonData);
    
    fs.writeFile(outputFilePath, JSON.stringify(result, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            return;
        }
        console.log(`Output written to ${outputFilePath}`);
    });
});