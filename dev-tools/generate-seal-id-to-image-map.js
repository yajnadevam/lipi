const fs = require('fs');
const path = require('path');

// Define the regex pattern equivalent to the provided Python regex
const sealImageNamePattern = /^([A-Za-z]{1,5})[-]+(\d+)(.*)$/;

function groupFilesBySealId(sealImagesFolder) {
    const fileMap = {};

    console.log(`Reading files from ${path.resolve(sealImagesFolder)}`);

    // Read all files in the folder
    const files = fs.readdirSync(path.resolve(sealImagesFolder));

    files.forEach(file => {
        console.log(file);
        const match = file.match(sealImageNamePattern);
        if (match) {
            const place = match[1];
            const number = match[2];
            const suffix = match[3] || ''; // Default to empty string if no suffix
            const sealId = `${place}-${number}`;

            console.log("Matched sealId: ", sealId, " Suffix:", suffix);

            if (!fileMap[sealId]) {
                fileMap[sealId] = [];
            }

            fileMap[sealId].push({ file, suffix });
        }
    });

    // Sort the file names for each sealId
    Object.keys(fileMap).forEach(sealId => {
        fileMap[sealId].sort((a, b) => {
            const suffixA = a.suffix || '';
            const suffixB = b.suffix || '';

            const isNumericA = /^_[0-9]/.test(suffixA);
            const isNumericB = /^_[0-9]/.test(suffixB);

            // Ensure `_0-9` suffixes appear lower than `_a-zA-Z` suffixes
            if (isNumericA !== isNumericB) {
                return isNumericA ? 1 : -1;
            }

            // Otherwise, sort normally
            return a.file.toLowerCase().localeCompare(b.file.toLowerCase()) || a.file.localeCompare(b.file);
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

    return fileMap;
}

// Example usage:
const sealImagesFolder = './public/seal_images'; // Change this to your folder path
const result = groupFilesBySealId(sealImagesFolder);
