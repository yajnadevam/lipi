<template>
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <!-- </h1> -->
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
    <v-menu
      :close-on-content-click="false"
      :close-delay="2000"
      :open-on-hover="true"
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-icon :icon="icons.cog"></v-icon>
        </v-btn>
      </template>
      <v-list style="padding: 4px">
        <v-list-item-title>
          <v-switch
            v-model="optionCanonical"
            color="primary"
            label="Canonical"
            @update:model-value="persistCanonical"
          >
          </v-switch
        ></v-list-item-title>
        <v-list-item-title>
          <v-switch
            v-model="optionBroken"
            color="red"
            label="Include Broken"
            @update:model-value="persistBroken"
          >
          </v-switch>
        </v-list-item-title>
        <v-list-item-title>
          <v-switch
            v-model="lightTheme"
            color="primary"
            label="Light Theme"
            @update:model-value="toggleTheme"
          >
          </v-switch>
        </v-list-item-title>
      </v-list>
    </v-menu>

    <v-btn icon>
      <v-icon :icon="activeFab.icon"></v-icon>
    </v-btn>
  </v-toolbar>
  <HeaderLinks />

  <v-navigation-drawer v-model="drawer" location="right" temporary>
    <v-list-item title="Allograph values"></v-list-item>
    <v-fab
      @click.stop="drawer = !drawer"
      :key="activeFab.icon"
      :color="activeFab.color"
      :icon="activeFab.icon"
      class="ms-1 mb-1"
      location="top right"
      size="40"
      app
      appear
    ></v-fab>
    <v-divider></v-divider>

    <v-list density="compact" nav>
      <Key />
    </v-list>
  </v-navigation-drawer>
  <v-fab
    @click.stop="drawer = !drawer"
    :key="activeFab.icon"
    :color="activeFab.color"
    :icon="activeFab.icon"
    class="ms-1 mb-1"
    location="top right"
    size="40"
    absolute
    app
    appear
  ></v-fab>

  <v-card>
    <v-layout>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
          <v-data-table
            ref="target"
            v-model:expanded="expanded"
            :custom-filter="filterInscriptions"
            :first-icon="icons.pageFirst"
            :last-icon="icons.pageLast"
            :next-icon="icons.chevRight"
            :prev-icon="icons.chevLeft"
            :headers="computedHeaders"
            :sort-by="sortBy"
            item-value="id"
            :items="filtered"
            :page="pageNum"
            :row-props="itemrow"
            :search="search"
            show-expand
            @update:page="pageChange"
            @update:sort-by="sortChange"
            mobile-breakpoint="200"
          >
            <template #top>
              <v-progress-linear
                height="25"
                :model-value="complete"
                color="green"
              >
                <template v-slot:default="{ value }">
                  <strong>{{ Math.ceil(value) }}% translated</strong>
                </template>
              </v-progress-linear>
              <div class="pa-2 search-container">
                <v-text-field
                  id="search"
                  v-model="search"
                  clearable
                  :clear-icon="icons.clear"
                  @update:model-value="updateSearch"
                  @click:clear="clearSearch"
                  label="Search Indus valley inscriptions"
                />
              </div>
            </template>

            <template v-slot:item.sanskrit="{ item }">
              <template v-for="word in renderSanskrit(item.sanskrit)">
                <span
                  v-if="word.link == true"
                  class="sanskrit-link"
                  @click="onSanskritClick(word.word)"
                >
                  {{ word.word }}
                </span>
                <span v-else>
                  {{ word.word }}
                </span>
              </template>
            </template>

            <template v-slot:item.data-table-expand="{ item, isExpanded }">
              <v-icon
                v-if="isExpandedRow(item.id)"
                :icon="icons.collapse"
                @click="handleExpansion(item, isExpanded)"
              ></v-icon>
              <v-icon
                v-else
                :icon="icons.expand"
                @click="handleExpansion(item, isExpanded)"
              ></v-icon>
            </template>

            <template v-slot:expanded-row="{ columns, item }">
              <tr class="expanded-content">
                <td></td>
                <td>{{ item.site }}</td>
                <td></td>
                <td class="sanskrit" style="text-align: right">
                  {{ item.description }}
                </td>
                <td></td>
                <td>{{ item.notes }}</td>
                <td></td>
              </tr>
              <tr v-if="fullrandom">
                <td></td>
                <td></td>
                <td></td>
                <td class="random" style="text-align: right">
                  {{ item.random }}
                </td>
                <td></td>
                <td></td>
              </tr>
              <!-- Row for Seal Images -->
              <tr
                v-if="sealImages[item.cisi] && sealImages[item.cisi].length > 0"
                class="expanded-content"
              >
                <td colspan="12" class="text-center">
                  <v-container>
                    <v-row justify="center">
                      <v-col
                        v-for="(img, index) in sealImages[item.cisi].slice(
                          0,
                          2
                        )"
                        :key="index"
                        :cols="6"
                        class="image-container"
                      >
                        <v-img
                          :src="`/seal_images/${img}`"
                          contain
                          class="hover-image"
                          :class="getSealClasses(item)"
                        />
                      </v-col>
                    </v-row>
                  </v-container>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </v-main>
    </v-layout>
  </v-card>

  <v-dialog v-model="showPrakriyaDialog" max-width="600">
    <v-card>
      <v-card-title>{{ prakriyaDialogContent.word }}</v-card-title>
      <v-card-text>
        <template v-for="krdanta in prakriyaDialogContent.krdantas">
          <!-- Todo: Maybe needs to be made more prominent-->
          <span>{{ krdanta.dhatu }} {{ krdanta.pratyaya }}</span>

          <template v-for="step in krdanta.steps">
            <div>
              <template v-if="step.result.length == 1">
                <span>
                  {{
                    Sanscript.t(
                      step.result[0].text.replaceAll("\\", ""),
                      "slp1",
                      "devanagari"
                    )
                  }}
                </span>
              </template>
              <template v-else>
                {{
                  Sanscript.t(
                    step.result[0].text.replaceAll("\\", ""),
                    "slp1",
                    "devanagari"
                  )
                }}
                +
                {{
                  Sanscript.t(
                    step.result[1].text.replaceAll("\\", ""),
                    "slp1",
                    "devanagari"
                  )
                }}
              </template>
            </div>
          </template>
          {{ prakriyaDialogContent.word }}
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showPrakriyaDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { toRefs } from "vue";
import sealImages from "@/assets/data/seal_id_and_image_mapping.json"; // Ensure the file is in `assets`
import { useTheme } from "vuetify";
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  localStorage.setItem("theme", theme.global.name.value);
}
</script>
<script>
import { csv2json } from "json-2-csv";
import Key from "../components/Key.vue";
import HeaderLinks from "../components/HeaderLinks.vue";
import incx from "../assets/data/inscriptions.csv?raw";
import urls from "../assets/data/urls.csv?raw";
import xlits from "../assets/data/xlits.csv?raw";
import prakriyas from "../assets/data/prakriyas.json";
import dhatupatha from "../assets/vidyut/vidyut_dhatupatha_5.tsv";
import initVidyut, { Vidyut } from "../vidyut/vidyut_prakriya.js";

// eslint-disable-next-line import/first
import Sanscript from "@indic-transliteration/sanscript";

await initVidyut();
const dhatupathaText = await (await fetch(dhatupatha)).text();
const vidyut = Vidyut.init(dhatupathaText);

const urllist = csv2json(urls);
const urlMap = {};
urllist.forEach((item) => {
  urlMap[item.key] = item.url;
});
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

export default {
  components: { Key, HeaderLinks },
  data() {
    return {
      icons: {
        pageFirst: [
          "M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z",
        ],
        pageLast: [
          "M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z",
        ],
        chevLeft: [
          "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
        ],
        chevRight: [
          "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
        ],
        expand: ["M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"],
        collapse: [
          "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
        ],
        cog: [
          "M 12 15.5 A 3.5 3.5 0 0 1 8.5 12 A 3.5 3.5 0 0 1 12 8.5 A 3.5 3.5 0 0 1 15.5 12 A 3.5 3.5 0 0 1 12 15.5 M 19.43 12.97 C 19.47 12.65 19.5 12.33 19.5 12 C 19.5 11.67 19.47 11.34 19.43 11 L 21.54 9.37 C 21.73 9.22 21.78 8.95 21.66 8.73 L 19.66 5.27 C 19.54 5.05 19.27 4.96 19.05 5.05 L 16.56 6.05 C 16.04 5.66 15.5 5.32 14.87 5.07 L 14.5 2.42 C 14.46 2.18 14.25 2 14 2 H 10 C 9.75 2 9.54 2.18 9.5 2.42 L 9.13 5.07 C 8.5 5.32 7.96 5.66 7.44 6.05 L 4.95 5.05 C 4.73 4.96 4.46 5.05 4.34 5.27 L 2.34 8.73 C 2.21 8.95 2.27 9.22 2.46 9.37 L 4.57 11 C 4.53 11.34 4.5 11.67 4.5 12 C 4.5 12.33 4.53 12.65 4.57 12.97 L 2.46 14.63 C 2.27 14.78 2.21 15.05 2.34 15.27 L 4.34 18.73 C 4.46 18.95 4.73 19.03 4.95 18.95 L 7.44 17.94 C 7.96 18.34 8.5 18.68 9.13 18.93 L 9.5 21.58 C 9.54 21.82 9.75 22 10 22 H 14 C 14.25 22 14.46 21.82 14.5 21.58 L 14.87 18.93 C 15.5 18.67 16.04 18.34 16.56 17.94 L 19.05 18.95 C 19.27 19.03 19.54 18.95 19.66 18.73 L 21.66 15.27 C 21.78 15.05 21.73 14.78 21.54 14.63 L 19.43 12.97 Z",
        ],
        clear: [
          "M 8.00386 9.41816 C 7.61333 9.02763 7.61334 8.39447 8.00386 8.00395 C 8.39438 7.61342 9.02755 7.61342 9.41807 8.00395 L 12.0057 10.5916 L 14.5907 8.00657 C 14.9813 7.61605 15.6144 7.61605 16.0049 8.00657 C 16.3955 8.3971 16.3955 9.03026 16.0049 9.42079 L 13.4199 12.0058 L 16.0039 14.5897 C 16.3944 14.9803 16.3944 15.6134 16.0039 16.0039 C 15.6133 16.3945 14.9802 16.3945 14.5896 16.0039 L 12.0057 13.42 L 9.42097 16.0048 C 9.03045 16.3953 8.39728 16.3953 8.00676 16.0048 C 7.61624 15.6142 7.61624 14.9811 8.00676 14.5905 L 10.5915 12.0058 L 8.00386 9.41816 Z",
        ],
      },

      sortBy: [{ key: "textlength", order: "desc" }],
      search: "",
      drawer: null,
      pageNum: 1,
      oldPageNum: null,
      expanded: [],
      headers: [
        { title: "Seal ID", key: "id" },
        { title: "CISI ID", key: "cisi" },
        { title: "Len", key: "textlength" },
        {
          title: "Inscription(R to L)",
          key: "text",
          align: "end",
          cellProps: { class: "indus" },
        },
        { title: "Transliteration", key: "description", align: " d-none" },
        { title: "Notes", key: "notes", align: " d-none" },
        {
          title: "Sanskrit(L to R)",
          key: "sanskrit",
          cellProps: { class: "sanskrit" },
        },
        { title: "Translation", key: "translation" },
        { title: "", key: "data-table-expand" },
      ],
      items: inx,
      optionCanonical: false,
      optionBroken: false,
      lightTheme: false,
      fullrandom: fullrandom,
      showPrakriyaDialog: false,
      prakriyaDialogContent: {},
    };
  },
  computed: {
    complete() {
      console.log("C", decipheredLen, "/", totalLen);
      return (100 * decipheredLen) / totalLen;
    },
    completeCount() {
      console.log("N", decipheredCount, "/", totalCount);
      return (100 * decipheredCount) / totalCount;
    },
    activeFab() {
      return this.drawer
        ? { color: "white", icon: this.icons.chevRight }
        : { color: "green", icon: this.icons.chevLeft };
    },
    filtered() {
      return this.items.filter((e) => this.optionBroken || e.complete === "Y");
    },
    computedHeaders() {
      this.headers.forEach((h) => {
        if (h.title === "Inscription(R to L)") {
          h.key = this.optionCanonical ? "canonized" : "text";
        }
      });
      return this.headers;
    },
  },

  methods: {
    chevLeft() {
      return this.icons.chevLeft;
    },
    chevRight() {
      return this.icons.chevRight;
    },
    isExpandedRow(id) {
      return this.expanded.indexOf(id) > -1;
    },
    handleExpansion(item, state) {
      const itemIndex = this.expanded.indexOf(item.id);

      itemIndex > -1
        ? this.expanded.splice(itemIndex, 1)
        : this.expanded.push(item.id);
    },
    isIncompleteRegex(query) {
      return (
        (query.startsWith("/") || query.endsWith("/")) &&
        !(query.startsWith("/") && query.endsWith("/"))
      );
    },
    filterInscriptions(_value, query, item) {
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
              if (
                column === "site" &&
                value.toLocaleLowerCase() === "unknown"
              ) {
                value = null;
              }

              // Rewrite unicorn as bull1 since that's the internal name
              if (column === "symbol" && q.toLocaleLowerCase() === "unicorn") {
                q = "bull1";
              }

              if (!this.filterPart(value, q ? q : "**", item, useCanonical)) {
                return false;
              }
            }
            continue;
          }
        }

        // Filter regex expressions if they are incomplete
        if (this.isIncompleteRegex(queryTerm)) {
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
              this.filterRegex(signColumn, queryTerm, item, useCanonical) ||
              this.filterRegex(sanskrit, queryTerm, item, useCanonical) ||
              this.filterRegex(translation, queryTerm, item, useCanonical)
            )
          ) {
            return false;
          }
          continue;
        }

        // First check in sign column text or canonized dependeing on useCanonical flag, then iterate through all other
        // columns if a match is not found
        let found = this.filterPart(signColumn, queryTerm, item, useCanonical);
        if (!found) {
          // Iterate through every column in the row except text and canonized
          for (let i = 0; queryTerm && i < keys.length; i++) {
            if (
              this.filterPart(
                item.columns[keys[i]],
                queryTerm,
                item,
                useCanonical
              )
            ) {
              found = true;
              break;
            }
          }
        }

        if (!found) return false;
      }
      return true;
    },
    isValidValueAndQuery(value, query) {
      return value != null && query != null && query.length > 0;
    },
    isCompleteOrBrokenIsAllowed(item) {
      return (
        item.raw.complete === "Y" ||
        (this.optionBroken &&
          (item.raw.complete === "N" || item.raw.complete === "?"))
      );
    },
    filterRegex(value, query, item, useCanonical) {
      if (
        !this.isValidValueAndQuery(value, query) ||
        !this.isCompleteOrBrokenIsAllowed(item)
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
    },
    filterPart(value, query, item, useCanonical) {
      if (
        !this.isValidValueAndQuery(value, query) ||
        !this.isCompleteOrBrokenIsAllowed(item)
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
    },
    itemrow(item) {
      return item.item.complete === "Y"
        ? { class: "primary--text" }
        : { class: "text-red" };
    },
    pageChange(newPage) {
      const isSearching = this.search !== null && this.search !== "";
      if (isSearching) {
        this.pageNum = newPage;
      } else {
        localStorage.setItem("page", newPage);
        this.pageNum = this.oldPageNum || newPage;
        this.oldPageNum = null;
      }
    },
    sortChange(newSort) {
      localStorage.setItem("sort", JSON.stringify(newSort));
      this.sortBy = newSort;
    },
    persistCanonical(value) {
      localStorage.setItem("canonical", value);
    },
    persistBroken(value) {
      localStorage.setItem("broken", value);
    },
    updateSearch(value) {
      if (value !== "" && value !== null) {
        this.oldPageNum = this.oldPageNum || this.pageNum;
        localStorage.setItem("search", this.search);
      } else {
        this.clearSearch();
      }
    },
    clearSearch() {
      if ((this.search === null || this.search === "") && this.oldPageNum) {
        this.pageNum = this.oldPageNum;
      }
      localStorage.removeItem("search");
    },
    pasteSearch() {
      const selection = window.getSelection().toString();
      if (selection === null || selection === "") return;
      this.search = selection.trim() + (this.search || "");
      localStorage.setItem("search", this.search);
    },
    getSealClasses(item) {
      let material = item.material
        ? item.material.toLowerCase().replace(/\s+/g, "")
        : "";
      let color = item.color
        ? item.color.toLowerCase().replace(/[\s\-]+/g, "")
        : "";

      return `seal-mat-${material} seal-mat-${material}-${color}`;
    },
    checkPrakriyaExists(word) {
      const slp1Word = Sanscript.t(word, "devanagari", "slp1");
      if (prakriyas[slp1Word]) {
        return true;
      }
      return false;
    },
    // Todo: Maybe refactor better ?
    renderSanskrit(sanskrit) {
      const parts = sanskrit.split("\n");
      let sanskritResult = [];
      let word = "";
      for (let i = 0; i < parts[0].length; i++) {
        if (parts[0][i] === "—" || parts[0][i] === " ") {
          sanskritResult.push(
            this.checkPrakriyaExists(word) ? { word, link: true } : { word }
          );
          sanskritResult.push({ word: parts[0][i] });
          word = "";
        } else {
          word += parts[0][i];
        }
      }
      sanskritResult.push(
        this.checkPrakriyaExists(word) ? { word, link: true } : { word }
      );
      sanskritResult.push({ word: "\n" });
      sanskritResult.push({ word: parts[1] });
      return sanskritResult;
    },
    generateKrdantaInput(code, krt) {
      return {
        code: code, // example dhatu code
        krt: krt, // BaseKrt
        sanadi: [], // Sanadi is an array of strings
        upasarga: [], // array of strings
        lakara: null, // or something like "Lat" if required
        prayoga: null, // or "Kartari", etc.
      };
    },
    onSanskritClick(devanagariWord) {
      const slp1Word = Sanscript.t(devanagariWord, "devanagari", "slp1");
      const prakriyaKeys = prakriyas[slp1Word];

      // Todo: Need to do for all prakriyas
      const prakriyaKey = prakriyaKeys[0].split("_");
      const krdantaInput = this.generateKrdantaInput(
        prakriyaKey[0],
        Sanscript.t(prakriyaKey[1], "devanagari", "slp1")
      );
      const _krdantas = vidyut.deriveKrdantas(krdantaInput);
      const krdantas = [];

      // Todo: need to do for all krdantas
      krdantas.push({
        dhatu: prakriyaKey[0],
        pratyaya: prakriyaKey[1],
        steps: _krdantas[0].history,
        result: devanagariWord,
      });

      const prakriyaDialogContent = {
        word: devanagariWord,
        krdantas,
      };

      console.log(prakriyaDialogContent);

      this.prakriyaDialogContent = prakriyaDialogContent;
      this.showPrakriyaDialog = true;
    },
  },
  created() {
    this.pageNum = localStorage.getItem("page");
    this.search = localStorage.getItem("search");
    this.sortBy = JSON.parse(localStorage.getItem("sort")) || this.sortBy;
    this.optionCanonical = localStorage.getItem("canonical") === "true";
    this.optionBroken = localStorage.getItem("broken") === "true";
    this.lightTheme = localStorage.getItem("theme") == "light";
  },
  // eslint-disable-next-line vue/order-in-components
  mounted() {
    document.addEventListener("mouseup", (event) => {
      const classes = Array.from(event.target.classList);
      if (classes.includes("indus1")) this.pasteSearch();
    });
    setTimeout(function () {
      const splashScreen = document.querySelector(".splash");
      if (splashScreen) splashScreen.classList.add("hidden");
    }, 100);
  },
};
</script>

<style>
@font-face {
  font-family: "indus_scriptregular";
  src: url("../assets/fonts/indus-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-size: 24pt;
  font-display: swap;
}
.indus {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
  white-space: pre;
}
.sanskrit {
  white-space: pre;
}
.random {
  white-space: pre;
  color: orange;
}
.v-text-field input {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
}
.v-toolbar-title__placeholder {
  overflow: visible !important;
}

.hover-image {
  transition: transform 0.3s ease-in-out;
  max-width: 100%; /* Ensures it doesn't overflow */
  max-height: 200px; /* Ensures a consistent height */
}

.hover-image:hover {
  transform: scale(2);
  z-index: 10; /* Brings it above other elements */
}

.v-theme--light {
  .expanded-content {
    background: #f5f5dc;
    color: blue;
  }
}

.v-theme--dark {
  .expanded-content {
    background: black;
    color: yellow;
  }
}

.search-container {
  display: flex;
  flex-direction: column;
}

.seal-mat-steatite img {
  filter: sepia(80%) hue-rotate(320deg) saturate(200%) brightness(100%);
}

.seal-mat-steatite-white img {
  filter: sepia(80%) hue-rotate(320deg) saturate(110%) brightness(80%);
}

.seal-mat-steatite-blue img {
  filter: sepia(40%) hue-rotate(190deg) saturate(250%) brightness(100%)
    contrast(140%);
}

.seal-mat-steatite-grey img {
  filter: sepia(0%) hue-rotate(0deg) saturate(100%) brightness(100%);
}

.seal-mat-clay img {
  filter: sepia(80%) hue-rotate(320deg) saturate(200%) brightness(100%);
}

.seal-mat-clay-grey img {
  filter: sepia(0%) hue-rotate(0deg) saturate(100%) brightness(100%);
}

.seal-mat-copper img {
  filter: sepia(98%) hue-rotate(310deg) saturate(150%) brightness(60%);
}

.sanskrit {
  font-size: 16pt;
  word-spacing: 5pt;
}

.sanskrit-link {
  text-decoration: underline;
  cursor: pointer;
}
</style>
