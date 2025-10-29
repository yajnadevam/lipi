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
