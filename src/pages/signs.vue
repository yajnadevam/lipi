<template>
  <!--Header-->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-layout>
    <v-main>
      <div class="d-flex justify-center align-center h-100 card-container">
        <div v-for="sign in signs" :key="sign.sign" class="card">
          <span
            class="indus-symbol"
            @click="handleSignClick(sign.characterizedSign)"
          >
            {{ sign.characterizedSign }}
          </span>
          <span>
            {{ sign.sign }}
          </span>
          <span> Canonical: ({{ sign.canonical }}) </span>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { useTheme } from "vuetify";
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";
</script>

<script>
import { ref } from "vue";
import { csv2json } from "json-2-csv";
import xlits from "../assets/data/xlits.csv?raw";
import HeaderLinks from "../components/HeaderLinks.vue";

const signs = ref(
  csv2json(xlits, {
    keys: ["sign", "canonical"],
  })
    .map((value) => ({ ...value, sign: value.sign.toString() }))
    .filter((value) => ["000", "999"].indexOf(value.sign) == -1)
    .map((value) => ({ ...value, characterizedSign: characterize(value.sign) }))
);

// Todo: This should probably moved to a common location since its used across pages
function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

export default {
  components: { HeaderLinks },
  data() {
    return {
      items: signs,
    };
  },
  methods: {
    handleSignClick(characterizedSign) {
      localStorage.setItem("search", characterizedSign);
      window.location = "/";
    },
  },
  mounted() {
    // Todo: This should probably moved to a common location since its used across pages
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
.indus-symbol {
  font-family: indus_scriptregular;
  font-size: 48pt;
  font-display: swap;
  white-space: pre;
  cursor: pointer;
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
.card-container {
  display: flex;
  flex-wrap: wrap; /* Allows items to move to new lines */
  gap: 10px; /* Space between items */
  padding: 10px;
}
.card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  align-items: center;
}
.v-toolbar-title {
  overflow: visible !important;
}
</style>
