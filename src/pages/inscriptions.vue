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
      :sort-by="[{ key: 'cisi', order: 'desc' }]"  
      class="elevation-1"
    >
   
    <template v-slot:item.text="{ item }">
      <span class="indus-symbol">{{ characterize(item.text) }}</span>
    </template>
    <template v-slot:item.sanskrit="{ item }">
      <span  >{{  sanskritize(item.sanskrit) }}</span>
    </template>
 
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import signs from "../assets/data/inscriptions.json";
import HeaderLinks from "../components/HeaderLinks.vue";
import Sanscript from "@indic-transliteration/sanscript";


// Theme Setup
const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";

const iso = Sanscript.t(
  "aAiIuUoOfFxXEOMHkKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL",
  "slp1",
  "iast"
);

// Headers for the sortable table
const headers = ref([
  { title: "id", key: "id", sortable: false },
  { title: "cisi", key: "cisi", sortable: true },
  { title: "condition", key: "condition", sortable: true },
  { title: "text", key: "text", sortable: true }  ,
  { title: "sanskrit", key: "sanskrit", sortable: true }   
]);

const tableItems = ref(
  Object.entries(signs)
    .map(([key, info]) => ({
      id: info.id,
      cisi: info.cisi || 0,
      condition: info.condition || "",
      text: info.text || "",   
      sanskrit: info.sanskrit || ""
    }))
    .filter(item => item.condition.toLowerCase() !== "poor") // Exclude rows where condition is "poor"
);

// Handle Sign Click
const handleSignClick = (characterizedSign) => {
  localStorage.setItem("search", characterizedSign);
  window.location = "/";
};

function sanskritize(romanSanskrit)
{
    if(!romanSanskrit.startsWith("ref:"))
    {

      let result =       Sanscript.t(romanSanskrit, "slp1", "devanagari") +
        "\n" +
        Sanscript.t(romanSanskrit, "slp1", "iast");

      return result;

    }

    return romanSanskrit;

}

// Todo: This should probably be moved to a common location since it's used across pages
function characterize(input) {
 
  try{
    let result = "";

    let points = input.toString().replaceAll("]", " ");
    points = points.toString().replaceAll("[", " ");

    points = points.toString().replaceAll("  ", " ");

    let words = points.toString().split(" ");
    words.forEach((word) => {

      const charset = word.toString().split("-");    
      charset.forEach((point) => {
        result += "\\u" + (0xe000 + parseInt(point)).toString(16);
      });
    });
   
    return JSON.parse('"' + result + '"');

  }
  catch(err)
  {
    console.error("error parsing: "+input+" ",err);
  }

  return "";

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
