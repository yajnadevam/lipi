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
          <v-textarea
            v-model="textareaValue"
            class="container-item textarea"
            @update:model-value="translate"
            no-resize=""
            placeholder="Type in Devanagiri"
            >asda
          </v-textarea>
          <div class="indus-input" v-html="processText" />
          Right to Left Below:
          <div class="indus-input rtl" v-html="processText" />
          <v-data-table
            :items="items"
            :headers="headers"
            item-value="input"
            disable-pagination
            :items-per-page="-1"
            :hide-default-footer="true"
          >
            <template v-slot:item.expected="{ item }">
              <div class="indus-input-test" v-html="item.expected"></div>
            </template>
            <template v-slot:item.actual="{ item }">
              <div class="indus-input-test" v-html="pText(item.actual)"></div>
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
import testsCsv from "../assets/data/keyboard-tests.csv?raw";

const tests = csv2json(testsCsv, {
  keys: ["input", "expected"],
}).map((test) => ({ ...test, actual: test.input }));

function _processText(text) {
  return text
    .split("\n")
    .map((sentence) => {
      let words = sentence.split(" ");
      words = words.map((word) => {
        const allButLast = word.slice(0, -1);
        const lastLetter = `<span class='indus-input-fina'>${word.slice(
          -1
        )}</span>`;
        return allButLast + lastLetter;
      });
      return words.join("");
    })
    .join("\n");
}

export default {
  data() {
    const initialText = "";
    return {
      translation: initialText,
      textareaValue: initialText,
      items: tests,
      headers: [
        { title: "Input", key: "input" },
        { title: "Expected Output (L to R)", key: "expected" },
        { title: "Actual Output (L to R)", key: "actual" },
      ],
    };
  },
  computed: {
    processText() {
      return _processText(this.translation);
    },
  },
  methods: {
    translate(value) {
      this.translation = value;
    },
    pText(value) {
      return _processText(value);
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
  /* src: url("../assets/fonts/indus-input-font.otf") format("otf"); */
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
  font-feature-settings: "dlig" 1;
}
.indus-input-fina {
  font-feature-settings: "dlig" 1, "fina" 1;
}
.indus-input-test {
  font-family: indus_input;
  white-space: pre;
  font-size: 24pt;
  font-feature-settings: "dlig" 1;
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
  gap: 10pt;
}
.container-item {
  flex: auto;
}
.textarea {
  width: 500pt;
}
.rtl {
  transform: scale(-1, 1);
}
</style>
