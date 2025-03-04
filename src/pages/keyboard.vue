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
        <div class="d-flex justify-center align-center h-100 container">
          <div class="toolbar">
            <v-select
              v-model="formatValue"
              class="format-select"
              density="comfortable"
              item-title="label"
              item-value="value"
              :items="formats"
              @update:model-value="changeFormat"
              return-object
            >
            </v-select>
            <v-checkbox
              v-model="displayBrahmi"
              label="Use Brahmi-like Glyphs"
              true-icon="mdi-checkbox-marked"
              false-icon="mdi-checkbox-blank-outline"
            ></v-checkbox>
          </div>
          <v-textarea
            v-model="textareaValue"
            class="container-item textarea"
            @update:model-value="translate"
            no-resize=""
            :placeholder="placeholderText"
            autofocus
          >
          </v-textarea>
          <div class="attribution">
            Powered by
            <a
              target="_blank"
              href="https://github.com/ram-g-athreya/Indus-Input-Font"
              >Indus Input Font</a
            >
          </div>
          <!-- Right to Left Below: -->
          <div class="output-container">
            <div>
              <span class="text-right" v-if="translation.length > 0">
                <v-icon>mdi-arrow-left</v-icon> (R to L)
              </span>
              <span :class="indusInputCss">{{ translation }}</span>
            </div>

            <v-divider v-if="displayBrahmi == true" vertical />
            <div v-if="displayBrahmi == true">
              <span v-if="translation.length > 0">
                (L to R) <v-icon>mdi-arrow-right</v-icon>
              </span>
              <span v-if="displayBrahmi == true" class="brahmi">{{
                brahmiTranslation
              }}</span>
            </div>
          </div>
          <template
            v-if="
              JSON.stringify(formatValue) !=
                JSON.stringify(FORMATS.devanagari) && textareaValue.length > 0
            "
          >
            <div class="devanagari-output">
              <span>Devanagari: {{ translation }}</span>
            </div>
          </template>
          <!-- <v-data-table
            :items="items"
            :headers="headers"
            item-value="input"
            disable-pagination
            :items-per-page="-1"
            :hide-default-footer="true"
          >
            <template v-slot:item.expected="{ item }">
              <div class="indus-input" v-html="item.expected"></div>
            </template>
            <template v-slot:item.actual="{ item }">
              <div class="indus-input" v-html="item.actual"></div>
            </template>
          </v-data-table> -->
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
import Sanscript from "@indic-transliteration/sanscript";
import { csv2json } from "json-2-csv";
import "@mdi/font/css/materialdesignicons.css";
import testsCsv from "../assets/data/keyboard-tests.csv?raw";
import { aliases, mdi } from "vuetify/iconsets/mdi";

const DEVANAGARI = "devanagari";
const BRAHMI = "brahmi";
const HALANTH = "्";

const FORMATS = {
  devanagari: { label: "Devanagari", value: DEVANAGARI },
  slp1: { label: "SLP1", value: "slp1" },
  iast: { label: "IAST", value: "iast" },
};

const tests = csv2json(testsCsv, {
  keys: ["input", "expected"],
}).map((test) => ({ ...test, actual: test.input }));

const translateToBrahmi = (text, format) => {
  if (text) {
    const replacements = {
      "ा": "आ",
      "ि": "इ",
      "ी": "ई",
      "ु": "उ",
      "ू": "ऊ",
      "ृ": "ऋ",
      "ॄ": "ॠ",
      "ॅ": "ए",
      "ॆ": "ए",
      "े": "ए",
      "ै": "ऐ",
      "ॉ": "ओ",
      "ो": "ओ",
      "ो": "ओ",
      "ौ": "औ",
      "ॏ": "औ",
      "ॢ": "ऌ",
      "ॣ": "ॡ",
    };
    const x = text
      .split("")
      .map((c) => {
        if (c in replacements) {
          return Sanscript.t(replacements[c], format, BRAHMI);
        }

        return Sanscript.t(c, format, BRAHMI);
      })
      .join("");
    return x;
  }
  return text;
};

export default {
  data() {
    const initialText = "";
    return {
      icons: {
        defaultSet: "mdi",
        aliases,
        sets: {
          mdi,
        },
      },
      translation: initialText,
      brahmiTranslation: translateToBrahmi(initialText, DEVANAGARI),
      textareaValue: initialText,
      items: tests,
      formats: Object.values(FORMATS),
      formatValue: FORMATS.devanagari,
      displayBrahmi: false,
      headers: [
        { title: "Input", key: "input" },
        { title: "Expected Output (L to R)", key: "expected" },
        { title: "Actual Output (L to R)", key: "actual" },
      ],
    };
  },
  computed: {
    placeholderText() {
      if (this.formatValue.value == DEVANAGARI) {
        return "Type in Devanagari. Eg: ॐ रुद्राय नमः";
      } else if (this.formatValue.value == "slp1") {
        return "Type in SLP1. Eg: oM rudrAya namaH";
      } else if (this.formatValue.value == "iast") {
        return "Type in IAST. Eg: oṃ rudrāya namaḥ";
      }
    },
    indusInputCss() {
      const isSafari = () => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      };

      let cls = "";
      cls +=
        this.displayBrahmi == true ? "indus-brahmi-input " : "indus-input ";
      cls += isSafari() ? "disable-ligatures " : "";
      cls += "rtl";
      return cls;
    },
  },
  methods: {
    translate(value) {
      function massageOm(text, om) {
        return text
          .split(" ")
          .map((value) => {
            return value
              .split("\n")
              .map((v) => (v == om ? "ॐ" : v))
              .join("\n");
          })
          .join(" ");
      }

      function massage(t) {
        return t.split("\n").join(" \n ");
      }

      if (this.formatValue.value == DEVANAGARI) {
        this.translation = massage(value);
      } else {
        const omSub = this.formatValue.value == "slp1" ? "oM" : "oṃ";
        this.translation = massage(
          Sanscript.t(
            massageOm(value, omSub),
            this.formatValue.value,
            DEVANAGARI
          )
        );
      }
      this.brahmiTranslation = translateToBrahmi(this.translation, DEVANAGARI);
    },
    changeFormat(value) {
      this.formatValue = value;
      this.translate(this.textareaValue);
    },
  },
  // eslint-disable-next-line vue/order-in-components
  mounted() {
    setTimeout(function () {
      const splashScreen = document.querySelector(".splash");
      if (splashScreen) splashScreen.classList.add("hidden");
    }, 100);
  },
};
</script>

<style>
@font-face {
  font-family: "indus_input";
  src: url("../assets/fonts/indus-input-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: "indus_scriptregular";
  src: url("../assets/fonts/indus-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-size: 24pt;
  font-display: swap;
}
@font-face {
  font-family: "indus_brahmi_input";
  src: url("../assets/fonts/indus-brahmi-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-size: 24pt;
  font-display: swap;
}
.indus-input {
  font-family: indus_input;
  font-size: 24pt;
  white-space: pre;
  font-feature-settings: "dlig" 1;
  text-wrap: wrap;
}
.indus-brahmi-input {
  font-family: indus_brahmi_input;
  font-size: 24pt;
  white-space: pre;
  font-feature-settings: "dlig" 1;
  text-wrap: wrap;
}
.indus-input:after {
  content: " ";
}
.indus-input:before {
  content: " ";
}
.indus-input-test {
  font-family: indus_input;
  font-weight: normal;
  font-size: normal;
  white-space: pre;
  font-size: 24pt;
  font-feature-settings: "dlig" on, "fina" on;
}
.indus {
  font-family: indus_scriptregular;
  font-display: swap;
  font-size: 24pt;
  white-space: pre;
}
.container {
  padding: 15pt;
  display: flex;
  flex-direction: column;
}
.container-item {
  flex: auto;
}
.textarea {
  width: 90%;
}
.textarea textarea {
  font-size: 26pt;
  text-align: right;
}
.attribution {
  width: 90%;
  font-size: 10pt;
  text-align: right;
  margin-bottom: 15pt;
}
.attribution a {
  color: inherit;
}
.textarea .v-input__details {
  display: none;
}
.rtl {
  transform: scale(-1, 1);
  text-align: left;
}
.output-container {
  display: flex;
  flex-direction: row;
  width: 90%;
  margin-bottom: 15pt;
  gap: 10pt;
}
.output-container div {
  overflow: auto;
  flex: auto;
  display: flex;
  flex-direction: column;
}
.toolbar {
  margin-bottom: 5pt;
  display: flex;
  flex-direction: row;
  gap: 5pt;
}
.format-select {
  width: 140pt;
}
.devanagari-output {
  display: flex;
  flex-direction: column;
  width: 90%;
}
.devanagari-output span {
  text-align: right;
  overflow: auto;
  font-size: 16pt;
}
.disable-ligatures {
  font-feature-settings: "dlig" off;
}
.brahmi {
  font-size: 24pt;
  white-space: pre;
  text-wrap: wrap;
}
.text-right {
  text-align: right;
}
</style>
