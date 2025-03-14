const fs = require('fs');
const path = require('path');

// Define the regex pattern
const sealImageNamePattern = /^([A-Za-z]{1,5})[-]+(\d+)(.*)$/;

function groupFilesBySealId(sealImagesFolder) {
    const fileMap = {};
    const sealIdNumbers = {}; // Store numbers for each place

    console.log(`Reading files from ${path.resolve(sealImagesFolder)}`);

    // Read all files in the folder
    const files = fs.readdirSync(path.resolve(sealImagesFolder));

    files.forEach(file => {
        const match = file.match(sealImageNamePattern);
        if (match) {
            const place = match[1];
            const number = parseInt(match[2], 10); // Convert to integer
            const suffix = match[3] || ''; // Default to empty string
            const sealId = `${place}-${number}`;

            console.log("Matched sealId: ", sealId, " Suffix:", suffix);

            if (!fileMap[sealId]) {
                fileMap[sealId] = [];
            }
            fileMap[sealId].push({ file, suffix });

            // Store the numeric part for missing ID detection
            if (!sealIdNumbers[place]) {
                sealIdNumbers[place] = new Set();
            }
            sealIdNumbers[place].add(number);
        }
    });

    Object.keys(fileMap).forEach(sealId => {
        fileMap[sealId].sort((a, b) => {
            const suffixA = a.suffix || '';
            const suffixB = b.suffix || '';
    
            const firstCharA = suffixA.charAt(1) || ''; // Ignore the leading `_`
            const firstCharB = suffixB.charAt(1) || '';
    
            const isLowerA = /^[a-z]/.test(firstCharA);
            const isLowerB = /^[a-z]/.test(firstCharB);
            const isUpperA = /^[A-Z]/.test(firstCharA);
            const isUpperB = /^[A-Z]/.test(firstCharB);
            const isNumericA = /^[0-9]/.test(firstCharA);
            const isNumericB = /^[0-9]/.test(firstCharB);
    
            // Priority: lowercase < uppercase < numeric
            if (isLowerA !== isLowerB) return isLowerA ? -1 : 1;
            if (isUpperA !== isUpperB) return isUpperA ? -1 : 1;
            if (isNumericA !== isNumericB) return isNumericA ? 1 : -1;
    
            // If the same category, compare by length
            if (suffixA.length !== suffixB.length) return suffixA.length - suffixB.length;
    
            // Fallback to lexicographical order
            return suffixA.localeCompare(suffixB);
        });
    
        // Replace array of objects with just filenames
        fileMap[sealId] = fileMap[sealId].map(item => item.file);
    });
    

    let content = JSON.stringify(fileMap, null, 4);

    fs.writeFile('src/assets/data/seal_id_and_image_mapping.json', content, err => {
        if (err) {
            console.error(err);
        } else {
            console.log("File mapping written successfully.");
        }
    });

    console.log(JSON.stringify(fileMap, null, 4));

    // Find and log only missing Seal IDs that have both lower and higher numbers
    console.log("\n*** Missing Seal IDs ***");
    Object.keys(sealIdNumbers).forEach(place => {
        const numbers = Array.from(sealIdNumbers[place]).sort((a, b) => a - b);
        let missing = [];

        for (let i = 1; i < numbers.length; i++) {
            let expected = numbers[i - 1] + 1;
            while (expected < numbers[i]) {
                // Only log if there's a lower and higher number
                if (sealIdNumbers[place].has(expected - 1) && sealIdNumbers[place].has(numbers[i])) {
                    missing.push(`${place}-${expected}`);
                }
                expected++;
            }
        }

        if (missing.length > 0) {
            console.log(missing.join(', '));
        }
    });

    return fileMap;
}

// Example usage:
const sealImagesFolder = './public/seal_images'; // Change this to your folder path
const result = groupFilesBySealId(sealImagesFolder);
