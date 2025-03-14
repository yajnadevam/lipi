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
      
      <template v-slot:item.before_chars="{ item }">
        <span v-for="beforeItem in item.before_chars" :key="beforeItem.char"  >
          <span class="indus-symbol" >{{ characterize(beforeItem.char.toString()) }}</span>   ({{ beforeItem.freq }})
        </span>
      </template>

      <template v-slot:item.after_chars="{ item }">
        <span v-for="afterItem in item.after_chars" :key="afterItem.char" >
          <span class="indus-symbol" >{{ characterize(afterItem.char.toString()) }}</span> ({{ afterItem.freq }})
        </span>
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

const headers = ref([
  { title: "Sign", key: "character", sortable: false },
  { title: "code", key: "key", sortable: true },
  { title: "Words Having this Sign", key: "count", sortable: true },
  { title: "Follows # Signs", key: "before", sortable: true },
  { title: "Top Signs That Follow (# words)", key: "before_chars", sortable: false },
  { title: "Followed By # Signs", key: "after", sortable: true },
  { title: "Top Followed By Signs (# words)", key: "after_chars", sortable: false },
]);

const tableItems = ref(
  Object.entries(signs).map(([key, frequencyInfo]) => ({
    key,
    count: frequencyInfo.count || 0,
    before: frequencyInfo.before || [],
    after: frequencyInfo.after || [],
    before_chars: (frequencyInfo.before || []).slice(0, 2), // Keep `{char, freq}` pairs
    after_chars: (frequencyInfo.after || []).slice(0, 2),   // Keep `{char, freq}` pairs
  }))
);



// Handle Sign Click
const handleSignClick = (characterizedSign) => {
  localStorage.setItem("search", characterizedSign);
  window.location = "/";
};

// Todo: This should probably be moved to a common location since it's used across pages
function characterize(input) {
 
 try{
   let result = "";

   let points = input.toString().replaceAll("]", "-");
   points = points.toString().replaceAll("[", "-");
   points = points.toString().replaceAll("/", "-");

   const charset = points.toString().split("-");    
     charset.forEach((point) => {
       if(point)
       {
         result += "\\u" + (0xe000 + parseInt(point)).toString(16);          
       }
      
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
