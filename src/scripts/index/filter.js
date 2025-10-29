import { csv2json } from "json-2-csv";
import incx from "@/assets/data/inscriptions.csv?raw";
import xlits from "@/assets/data/xlits.csv?raw";

// eslint-disable-next-line import/first
import Sanscript from "@indic-transliteration/sanscript";

// Todo: ADDED VERBATIM FROM INDEX VUE NEED TO SORT OUT LATER
const inx = csv2json(incx, {
  keys: [
    "id",
    "cisi",
    "site",
    "material",
    "color",
    "complete",
    "text",
    "text length",
    "sanskrit",
    "translation",
    "notes",
    "symbol",
    "phase",
    "period",
  ],
});
const iso = Sanscript.t(
  "aAiIuUoOfFxXEOMHkKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL",
  "slp1",
  "iast"
);
const slp = "aiukgcjtdnpbmyrlvsmst";
const xlitarray = csv2json(xlits);
const fullrandom = false;

let totalLen = 0;
let totalCount = 0;
let decipheredLen = 0;
let decipheredCount = 0;

const canonMap = {};
const xlitmap = {};
const inxMap = {};

xlitarray.forEach((element) => {
  xlitmap[element.sign] = {};
  xlitmap[element.sign].xlit = element.xlit;
  xlitmap[element.sign].canonical = element.canonical;
  xlitmap[element.sign].random = mkrandom(fullrandom ? iso : slp);
  xlitmap[element.sign].regex = element.regex || element.xlit;
  canonMap[characterize(element.sign)] = characterize(element.canonical);
});

xlitarray.forEach((element) => {
  mkregex(xlitmap[element.sign]);
});

inx.forEach((el) => {
  const analyzed = xlitize(el.text);
  el.description = analyzed.description;
  el.random = analyzed.random;
  el.regex = analyzed.regex;
  const canonized = canonize(el.text);
  el.text = canonized.str; // jsize(el.text)
  el.textlength = parseInt(el["text length"]);
  el.sanskrit = el.sanskrit ? el.sanskrit.replaceAll("-", "—") : el.sanskrit;
  totalLen += el.complete === "Y" ? el.textlength : 0;
  totalCount += el.complete === "Y" ? 1 : 0;
  decipheredLen += el.complete === "Y" && el.sanskrit ? el.textlength : 0;
  // if (el.translation) console.log(el.translation)
  decipheredCount += el.translation ? 1 : 0;
  el.canonized = canonized.canon;
  //  if(el.complete === 'N' && el.sanskrit) console.log(">>", el.id, "L", el.textlength, 'C:', el.complete, 'X:', el.translation, 'D:', decipheredLen, 'T:', totalLen)
  if (el.sanskrit) {
    if (el.sanskrit.startsWith("ref:")) {
      Object.assign(el, resolve(el.sanskrit));
    } else {
      // console.log(">>", Sanscript.t(el.sanskrit, "slp1", "iast"));
      el.sanskrit =
        Sanscript.t(el.sanskrit, "slp1", "devanagari") +
        "\n" +
        Sanscript.t(el.sanskrit, "slp1", "iast");
    }
  } else {
    el.sanskrit = "*" + analyzed.str.split("-").reverse().join(""); // el.description.replaceAll('-', '')
  }
  // if(el.sanskrit) {
  //   el.sanskrit = el.sanskrit.split(/—|\s/).map((key) => {
  //   if(key=='अकक') {
  //     console.log(key, urlMap[key])
  //     return urlMap[key] ? '<a href="' + urlMap[key] + '">' + key + '</a>' : key
  //     // return key
  //   }
  //   }).join('—')
  // }
  inxMap[el.id] = el;
});

function mkrandom(alphabet) {
  const randomInd = Math.floor(Math.random() * alphabet.length);
  return alphabet.charAt(randomInd);
}

function resolve(ref) {
  const referred = inxMap[ref.substring(4)];
  if (!referred) return console.log("Failed to find reference", ref);
  return { sanskrit: referred.sanskrit, translation: referred.translation };
}

function canonized(text) {
  let canonizedStr = "";
  for (let i = 0; i < parseInt(text.length); i++) {
    canonizedStr += canonMap[text.charAt(i)];
  }
  return canonizedStr;
}

function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

function canonize(text) {
  text = text.replaceAll("/", "-999-999-999-999-");
  const re = /(\d+)/g;
  const results = text.match(re);
  let str = "";
  let canon = "";
  results.forEach((row) => {
    const thisChar = "\\u" + (0xe000 + parseInt(row)).toString(16);
    str += thisChar;
    if (row !== xlitmap[row].canonical) {
      if (!xlitmap[row].canonical) return row;
      const canel = xlitmap[row].canonical.toString().split("-");
      canon += canel
        .map((a) => {
          return "\\u" + (0xe000 + parseInt(a)).toString(16);
        })
        .join("");
    } else {
      canon += thisChar;
    }
  });
  str = JSON.parse('"' + str + '"');
  canon = JSON.parse('"' + canon + '"');
  return { str, canon };
}

function mkregex(element) {
  if (!element.canonical || !(typeof element.canonical === "string")) {
    if (!xlitmap[element.canonical]) {
      return console.log("No xlit for", element, element.canonical);
    }
    element.xlit = xlitmap[element.canonical].xlit;
    element.regex = element.xlit;
    return;
  }

  const list = element.canonical.split("-").reverse();
  let regex = "";
  let lit = "";
  list.forEach((item) => {
    const sign = xlitmap[item];
    if (sign) {
      lit += sign.xlit;
      regex += sign.regex || sign.xlit;
    } else {
      console.log("no xlit for", item);
    }
  });
  element.xlit = element.xlit || lit;
  element.regex = element.regex || regex;
  return regex;
}

function xlitize(text) {
  const re = /(\d+)/g;
  const results = text.match(re).reverse();
  if (xlitmap[results[0]] === undefined) {
    return console.log("Warning: Missing sign", results[0]);
  }
  let str = xlitmap[results[0]].xlit;
  let rnd = xlitmap[results[0]].random;
  let regex = str;
  results.shift();
  results.forEach((row) => {
    const sign = xlitmap[row];
    if (sign) {
      if (
        str.match(/^.*([iu]|an|as)$/) == null &&
        sign.xlit.match(/^[aiu]$/) == null &&
        !str.endsWith(".")
      ) {
        str += "a";
        regex += "a?";
      }
      if (
        !fullrandom &&
        rnd.match(/^.*([iueofFxX]|an|as)$/) == null &&
        sign.random.match(/^[aiu]$/) == null &&
        !str.endsWith(".")
      ) {
        rnd += "a";
      }
      str += "-" + sign.xlit;
      rnd += "-" + sign.random;
      regex += sign.xlit;
    } else {
      console.log("Warning: Missing sign", row);
    }
  });
  if (str.match(/.*([iu]|an|as)$/) === null) {
    str += "a";
    regex += "a?";
  }
  if (!fullrandom && rnd.match(/.*([iueo]|an|as)$/) === null) {
    rnd += "a";
  }
  str = str.split("-").reverse().join("-");
  rnd = rnd.split("-").reverse().join("-");
  const description = str.split("-").join("-");
  const random = "⚄ random: " + rnd;
  return { str, regex, description, random };
}
// Todo: ADDED VERBATIM FROM INDEX VUE NEED TO SORT OUT LATER END

export const filterInscriptions = (_value, query, item, optionBroken) => {
  // Helper Functions
  function isValidValueAndQuery(value, query) {
    return value != null && query != null && query.length > 0;
  }

  function isCompleteOrBrokenIsAllowed(item) {
    return (
      item.raw.complete === "Y" ||
      // ToDo: this needs to be figured out doesnt work in the compartmentalized scheme probably
      (optionBroken && (item.raw.complete === "N" || item.raw.complete === "?"))
    );
  }

  function filterRegex(value, query, item, useCanonical) {
    if (
      !isValidValueAndQuery(value, query) ||
      !isCompleteOrBrokenIsAllowed(item)
    ) {
      return false;
    }

    const pattern = query.slice(1, -1); // Remove the slashes
    const regex = new RegExp(pattern);

    let canonicalMatch = false;
    if (useCanonical) {
      let canonizedPattern = "";
      for (let i = 0; i < pattern.length; i++) {
        if (pattern.charCodeAt(i) >= 0xe000) {
          canonizedPattern += canonized(pattern.charAt(i));
        } else {
          canonizedPattern += pattern.charAt(i);
        }
      }

      const canonizedRegex = new RegExp(canonizedPattern);
      canonicalMatch = canonizedRegex.test(canonized(value));
    }

    return regex.test(value) || canonicalMatch;
  }

  function filterPart(value, query, item, useCanonical) {
    if (
      !isValidValueAndQuery(value, query) ||
      !isCompleteOrBrokenIsAllowed(item)
    ) {
      return false;
    }

    // If query is any (represented as **) then filter out rows that have no value (empty)
    // Please note * is used to find yet to be translated seals so we are using ** for any
    if (query === "**")
      return value !== "" && value !== null && value !== "undefined";

    // Not sure if this check is really necessary
    const isValueStringOrNumber =
      typeof value === "string" || typeof value === "number";

    const matchesLength = query === "L" + value;
    const matchesSubstring =
      value
        .toString()
        .toLocaleLowerCase()
        .indexOf(query.toLocaleLowerCase()) !== -1;

    const matchesCanonical =
      query.charCodeAt(0) >= 0xe000 &&
      useCanonical &&
      canonized(value).indexOf(canonized(query)) !== -1;

    return (
      isValueStringOrNumber &&
      (matchesLength || matchesSubstring || matchesCanonical)
    );
  }

  function isIncompleteRegex(query) {
    return (
      (query.startsWith("/") || query.endsWith("/")) &&
      !(query.startsWith("/") && query.endsWith("/"))
    );
  }
  // Helper Functions end

  // Query processing starts here
  if (query == null) return false;
  const keys = Object.keys(item.columns).filter(
    (value) => value != "text" && value != "canonized"
  );
  const fields = query.trim().split(/\s+/);
  const rawValue = toRefs(item.raw);

  // Iterate through every segment of the query
  for (let f = 0; f < fields.length; f++) {
    let useCanonical = true;
    let queryTerm = fields[f];

    // Columnar Query
    if (queryTerm.indexOf(":") > -1) {
      let [column, q] = queryTerm.split(":");

      // If glyph search then we just disable canonical and modify the query and process in the subsequent sections
      // as regex query or simple string match
      if (column === "glyph") {
        if (q.length == 0) continue;
        useCanonical = false;
        queryTerm = q;
      } else {
        // If the column is valid, that is, it exists in the data try to match or else ignore this queryTerm
        if (rawValue[column]) {
          let value = rawValue[column].value;

          // If column is site and value is unknown substitute null value
          if (column === "site" && value.toLocaleLowerCase() === "unknown") {
            value = null;
          }

          // Rewrite unicorn as bull1 since that's the internal name
          if (column === "symbol" && q.toLocaleLowerCase() === "unicorn") {
            q = "bull1";
          }

          if (!filterPart(value, q ? q : "**", item, useCanonical)) {
            return false;
          }
        }
        continue;
      }
    }

    // Filter regex expressions if they are incomplete
    if (isIncompleteRegex(queryTerm)) {
      continue;
    }

    const signColumn = useCanonical
      ? rawValue["canonized"].value
      : rawValue["text"].value;

    // Regex Query
    if (queryTerm.startsWith("/") && queryTerm.endsWith("/")) {
      let [sanskrit, translation] = item.columns["sanskrit"].split("\n");
      sanskrit = sanskrit ? sanskrit.replaceAll("—", " ") : "";
      translation = translation ? translation.replaceAll("—", " ") : "";
      if (
        !(
          filterRegex(signColumn, queryTerm, item, useCanonical) ||
          filterRegex(sanskrit, queryTerm, item, useCanonical) ||
          filterRegex(translation, queryTerm, item, useCanonical)
        )
      ) {
        return false;
      }
      continue;
    }

    // First check in sign column text or canonized dependeing on useCanonical flag, then iterate through all other
    // columns if a match is not found
    let found = filterPart(signColumn, queryTerm, item, useCanonical);
    if (!found) {
      // Iterate through every column in the row except text and canonized
      for (let i = 0; queryTerm && i < keys.length; i++) {
        if (filterPart(item.columns[keys[i]], queryTerm, item, useCanonical)) {
          found = true;
          break;
        }
      }
    }

    if (!found) return false;
  }
  return true;
};
