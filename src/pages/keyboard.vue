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
              <v-icon :icon="icons.expand"></v-icon>
            </v-select>
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
          <div class="output-container rtl">
            <span class="indus-input">{{ translation }}</span>
          </div>
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
import testsCsv from "../assets/data/keyboard-tests.csv?raw";
import { placeholder } from "@babel/types";

const DEVANAGARI = "devanagari";

const FORMATS = {
  devanagari: { label: "Devanagari", value: DEVANAGARI },
  slp1: { label: "SLP1", value: "slp1" },
};

const tests = csv2json(testsCsv, {
  keys: ["input", "expected"],
}).map((test) => ({ ...test, actual: test.input }));

export default {
  data() {
    const initialText = "";
    return {
      icons: {
        expand: ["M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"],
      },
      translation: initialText,
      textareaValue: initialText,
      items: tests,
      formats: Object.values(FORMATS),
      formatValue: FORMATS.devanagari,
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
      }
    },
  },
  methods: {
    translate(value) {
      function massageOm(text, om) {
        return text
          .split(" ")
          .map((value) => (value == om ? "ॐ" : value))
          .join(" ");
      }

      function massage(t) {
        return t.split("\n").join(" \n ");
      }

      if (this.formatValue.value == DEVANAGARI) {
        this.translation = massage(value);
      } else {
        // Substitute
        value = this.translation = massage(
          Sanscript.t(
            massageOm(value, "oM"),
            this.formatValue.value,
            DEVANAGARI
          )
        );
      }
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
.indus-input {
  font-family: indus_input;
  font-size: 24pt;
  white-space: pre;
  font-variant-ligatures: discretionary-ligatures;
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
  flex-direction: column;
  width: 90%;
}
.output-container span {
  overflow: auto;
}
.toolbar {
  margin-bottom: 5pt;
}
.format-select {
  width: 200pt;
}
</style>
