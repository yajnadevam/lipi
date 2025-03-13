<template>
  <!-- Header -->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-container>
    <v-data-table
      :headers="headers"
      :items="tableItems"
      :sort-by="[{ key: 'count', order: 'desc' }]"  
      class="elevation-1"
    >
      <template v-slot:item.character="{ item }">
        <span class="indus-symbol">{{ characterize(item.key) }}</span>
      </template>

      <template v-slot:item.key="{ item }">
        <span class="key-label">{{ item.key }}</span>
      </template>

      <template v-slot:item.count="{ item }">
        <span class="key-label">{{ item.count }}</span>
      </template>

      <template v-slot:item.before="{ item }">
        <span class="key-label">{{ item.before.length }}</span>
      </template>

      <template v-slot:item.after="{ item }">
        <span class="key-label">{{ item.after.length }}</span>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import signs from "../assets/data/graph.json";
import HeaderLinks from "../components/HeaderLinks.vue";

// Theme Setup
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";

// Headers for the sortable table
const headers = ref([
  { title: "Character", key: "character", sortable: false },
  { title: "Key", key: "key", sortable: true },
  { title: "Frequency", key: "count", sortable: true },
  { title: "Follows", key: "before", sortable: true },
  { title: "Followed By", key: "after", sortable: true },
]);

// Convert sign data into a structured table format
const tableItems = ref(
  Object.entries(signs).map(([key, frequencyInfo]) => ({
    key,
    count: frequencyInfo.count || 0,
    before: frequencyInfo.before || [],
    after: frequencyInfo.after || [],
  }))
);

// Handle Sign Click
const handleSignClick = (characterizedSign) => {
  localStorage.setItem("search", characterizedSign);
  window.location = "/";
};

// Todo: This should probably be moved to a common location since it's used across pages
function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

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
