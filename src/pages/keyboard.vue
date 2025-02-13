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
          <div class="indus-input">{{ translation }}</div>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<!--  -->

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
function reverse(str) {
  return str.split("").reverse().join("");
}

export default {
  data() {
    const initialText = "अननं";
    return {
      translation: reverse(initialText),
      textareaValue: initialText,
    };
  },
  methods: {
    translate(value) {
      console.log(value, reverse(value));
      this.translation = reverse(value);
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
  font-size: 24pt;
  font-display: swap;
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
  font-display: swap;
  font-size: 24pt;
  white-space: pre;
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
</style>
