<template>
  <!-- Header -->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-container>

    <v-text-field
      v-model="searchQuery"
      label="Search"
      class="mb-4"
      clearable
    ></v-text-field>

        <v-data-table
        :headers="headers"
        :items="filteredItems" 
        :sort-by="[{ key: 'cisi', order: 'desc' }]"  

      >
   
    <template v-slot:item.text="{ item }">
      <span class="indus-symbol">{{ item.text }}</span>
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

const headers = ref([
  { title: "id", key: "id", sortable: false },
  { title: "cisi", key: "cisi", sortable: true },
  { title: "text", key: "text", sortable: true },
  { title: "sanskrit", key: "sanskrit", sortable: true },
  { title: "translation", key: "translation", sortable: true },
  { title: "notes", key: "notes", sortable: true },
  { title: "site", key: "site", sortable: true },
  { title: "area-section", key: "area-section", sortable: true },
  { title: "block-house", key: "block-house", sortable: true },
  { title: "room-grid", key: "room-grid", sortable: true },
  { title: "excavation-idno", key: "excavation-idno", sortable: true },
  { title: "time", key: "time", sortable: true },
  { title: "period", key: "period", sortable: true },
  { title: "phase", key: "phase", sortable: true },
  { title: "depth", key: "depth", sortable: true },
  { title: "boss", key: "boss", sortable: true },
  { title: "material", key: "material", sortable: true },
  { title: "complete", key: "complete", sortable: true },
  { title: "condition", key: "condition", sortable: true },

  { title: "text length", key: "text length", sortable: true },

]);


const tableItems = ref(
  Object.entries(signs)
    .map(([key, info]) => ({
      id: info.id,
      cisi: info.cisi || 0,
      site: info.site || "",
      "area-section": info["area-section"] || "",
      "block-house": info["block-house"] || "",
      "room-grid": info["room-grid"] || "",
      "excavation-idno": info["excavation-idno"] || "",
      time: info.time || "",
      period: info.period || "",
      phase: info.phase || "",
      depth: info.depth || "",
      boss: info.boss || "",
      material: info.material || "",
      complete: info.complete || "",
      condition: info.condition || "",
      text: characterize(info.text),
      "text length": info["text length"] || "",
      sanskrit: info.sanskrit || "",
      translation: info.translation || "",
      notes: info.notes || ""
    }))
    
);

const searchQuery = ref("");
const currentPage = ref(1);

const filteredItems = computed(() => {
  if (!searchQuery.value) return tableItems.value;
  return tableItems.value.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});



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

function characterize2(points) {
  let log =false;

  try
  {
    if(points.toString().includes("+032-031"))
    {
      console.log("characterize = "+points);
      log=true;
      
    }
    const charset = points.toString().split("-");
    let result = "";
    charset.forEach((point) => {
      result += "\\u" + (0xe000 + parseInt(point)).toString(16);
    });

    

    result = JSON.parse('"' + result + '"');

    if(log)
    {
      console.log("result = "+result);
      result = "check? "+result;
    }

    return result;
  }
  catch(err)
  {
    //console.error("error parsing: "+points+" ",err);
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
