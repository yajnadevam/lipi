import { csv2json } from "json-2-csv";
import words from "@/assets/data/words.csv?raw";

// eslint-disable-next-line import/first
import Sanscript from "@indic-transliteration/sanscript";

// Words dictionary
const wordsMap = {};
csv2json(words).forEach((value) => {
  const { word, seal_id, ...rest } = value;
  if (word) {
    if (!wordsMap[word]) {
      wordsMap[word] = {};
    }

    wordsMap[word][seal_id] = {
      word,
      ...rest,
    };
  }
});

const checkExplanationExists = (word) => {
  const slp1Word = Sanscript.t(word, "devanagari", "slp1");
  // if (wordsMap[slp1Word] || mwMap[slp1Word]) {
  if (wordsMap[slp1Word]) {
    return { word, link: true };
  }
  return { word };
};

export const renderSanskrit = (sanskrit) => {
  // We are only interested in parts[0] which is the Sanskrit text
  const parts = sanskrit.split("\n");
  let sanskritResult = [];
  let word = "";
  for (let i = 0; i < parts[0].length; i++) {
    if (parts[0][i] === "—" || parts[0][i] === " ") {
      sanskritResult.push(checkExplanationExists(word));
      sanskritResult.push({ word: parts[0][i] });
      word = "";
    } else {
      word += parts[0][i];
    }
  }
  sanskritResult.push(checkExplanationExists(word));
  sanskritResult.push({ word: "\n" });
  // parts[1] is the IAST text which will be appeneded as is as
  sanskritResult.push({ word: parts[1] });
  return sanskritResult;
};
