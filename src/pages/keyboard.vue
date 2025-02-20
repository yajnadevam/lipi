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
            placeholder="Type in Devanagari"
          >
          </v-textarea>
          <div class="output-container">
            <span
              v-for="(line, index) in textareaValue.split('\n')"
              :key="index"
              class="indus-input"
              >{{ line }}</span
            >
          </div>
          Right to Left Below:
          <div class="output-container rtl">
            <span
              v-for="(line, index) in textareaValue.split('\n')"
              :key="index"
              class="indus-input"
              >{{ line }}</span
            >
          </div>
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
              <div class="indus-input-test" v-html="item.actual"></div>
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

export default {
  data() {
    const initialText = "अननननन तन भणवीन";
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
    // Todo: This function is probably not needed
    processText() {
      return this.translation;
    },
  },
  methods: {
    translate(value) {
      this.translation = value;
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
  word-break: break-word;
  font-variant-ligatures: discretionary-ligatures;
  /* font-feature-settings: "fina" on; */
}

.indus-input:after {
  content: " ";
}
/* .indus-input-fina {
  font-feature-settings: "dlig" 1;  
} */
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
  text-align: left;
}
.output-container {
  display: flex;
  flex-direction: column;
}
.output-container span {
  flex: auto;
}
</style>
