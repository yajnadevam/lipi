<template>
  <!--Header-->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />
  <v-card>
    <v-layout>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
          <v-data-table
            ref="target"
            v-model:expanded="expanded"
            :hide-default-footer="true"
            :items="items"
            :headers="headers"
            item-value="index"
            disable-pagination
            :items-per-page="-1"
          >
            <template v-slot:item.phoneme="{ item }">
              <div class="item phoneme" v-html="item.phoneme" />
            </template>

            <template v-slot:item.glyphs="{ item }">
              <template v-for="glyph in item.glyphs">
                <span
                  :class="`${
                    expandedGlyph[item.index] == glyph ? 'active' : ''
                  }`"
                  class="indus glyph"
                  @click="handleGlyphClick(item, glyph)"
                >
                  {{ glyph.glyph }}
                </span>
              </template>
            </template>
            <template v-slot:expanded-row="{ item }">
              <tr class="expanded-row">
                <td>
                  <span><strong>Canonical</strong></span>
                </td>
                <td>
                  <span class="canonical-container">
                    <template
                      v-for="canonical in expandedGlyph[item.index].canonical"
                    >
                      <span class="canonical">
                        <span class="indus">{{ characterize(canonical) }}</span>
                        <span>({{ frequency[canonical] }})</span>
                      </span>
                    </template>
                  </span>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
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
import allographCsv from "../assets/data/allographs.csv?raw";
import frequency from "../assets/data/symbol-frequency.json";
import xlits from "../assets/data/xlits.csv?raw";

// Todo: This should probably moved to a common location since its used across pages
function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

const xlitsJson = csv2json(xlits, {
  keys: ["sign", "canonical"],
});

const allographs = csv2json(allographCsv, {
  keys: ["phoneme", "glyphs"],
});

const processed_allographs = allographs.map((allograph, index) => {
  return {
    ...allograph,
    index,
    glyphs: allograph.glyphs
      .toString()
      .split(" ")
      .map((glyph) => {
        let canonical = xlitsJson
          .filter((s) => s.canonical == glyph)
          .map((s) => s.sign.toString());
        return {
          canonical,
          glyph: characterize(glyph.toString()),
        };
      }),
  };
});

export default {
  data() {
    return {
      icons: {
        expand: ["M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"],
        collapse: [
          "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
        ],
      },
      items: processed_allographs,
      headers: [
        { title: "Phoneme", key: "phoneme", width: "90pt" },
        { title: "Glyphs", key: "glyphs" },
      ],
      expanded: [],
      expandedGlyph: {},
    };
  },
  methods: {
    isExpandedRow(id) {
      // return this.expanded.indexOf(id) > -1;
      return this.expanded.has(id);
    },
    handleGlyphClick(item, glyph) {
      const itemIndex = this.expanded.indexOf(item.index);
      if (itemIndex > -1) {
        if (this.expandedGlyph[item.index] == glyph) {
          this.expanded.splice(itemIndex, 1);
          delete this.expandedGlyph[item.index];
        } else {
          this.expandedGlyph[item.index] = glyph;
        }
      } else {
        this.expanded.push(item.index);
        this.expandedGlyph[item.index] = glyph;
      }
    },
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
.item {
  font-size: 18pt;
}
.indus {
  font-family: indus_scriptregular;
  font-display: swap;
  font-size: 24pt;
  white-space: pre;
}
.glyph {
  padding-right: 10pt;
  cursor: pointer;
}
.canonical-container {
  display: flex;
  flex-wrap: wrap; /* Allows items to move to new lines */
}
.canonical {
  display: flex;
  flex-direction: column;
  padding-right: 10pt;
  text-align: center;
}
.v-toolbar-title__placeholder {
  overflow: visible !important;
}
.phoneme {
  width: 90pt;
}
.v-theme--light {
  .active {
    color: blue;
  }
  .expanded-row {
    background: #f5f5dc;
    color: blue;
  }
}

.v-theme--dark {
  .active {
    color: yellow;
  }
  .expanded-row {
    background: black;
    color: yellow;
  }
}
</style>
