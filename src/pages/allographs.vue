<template>
  <v-card>
    <v-layout>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
          <v-data-table :hide-default-footer="true" :items="items">
            <template v-slot:item.phoneme="{ item }">
              <span class="item" v-html="item.phoneme" />
            </template>
            <template v-slot:item.name="{ item }">
              <span class="item" v-html="item.name" />
            </template>
            <template v-slot:item.glyphs="{ item }">
              <span class="item indus" v-html="item.glyphs" />
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

// Todo: This should probably moved to a common location since its used across pages
function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

const allographs = csv2json(allographCsv, {
  keys: ["phoneme", "name", "glyphs"],
});

const processed_allographs = allographs.map((allograph) => {
  console.log(allograph.glyphs.split(" "));
  return {
    ...allograph,
    glyphs: allograph.glyphs
      .split(" ")
      .map((glyph) => {
        console.log("this is the glyph" + glyph);
        if (glyph == "<br/>") return glyph;
        return characterize(glyph.toString());
      })
      .join(""),
  };
});

export default {
  data() {
    return {
      items: processed_allographs,
    };
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
  font-size: 18pt;
  white-space: pre;
  letter-spacing: 5pt;
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
</style>
