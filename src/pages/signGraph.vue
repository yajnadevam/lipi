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
        <div v-for="sign in items" :key="sign.sign" class="card" @click="handleSignClick(sign.sign)">
          <span>{{ sign }}</span>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import signs from "../assets/data/graph.json";
import HeaderLinks from "../components/HeaderLinks.vue";

// Theme Setup
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";

// Reactive State
const items = ref(signs);

// Handle Sign Click
const handleSignClick = (characterizedSign) => {
  localStorage.setItem("search", characterizedSign);
  window.location = "/";
};

// Splash Screen Removal
onMounted(() => {
  setTimeout(() => {
    const splashScreen = document.querySelector(".splash");
    if (splashScreen) splashScreen.classList.add("hidden");
  }, 100);
});
</script>

<style>
/* Your styles remain unchanged */
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
  gap: 10pt; /* Space between items */
  padding: 10pt;
}
.card {
  display: flex;
  flex-direction: column;
  padding: 20pt;
  align-items: center;
}
.v-toolbar-title {
  overflow: visible !important;
}
</style>
