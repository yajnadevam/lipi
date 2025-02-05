<template>
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-layout>
    <v-main>
      <div class="typing-tool">
        <textarea 
          v-model="inputText" 
          class="indus-input"
          rows="8" 
          cols="60"
          placeholder="Type here..."
          @keydown="handleKeyDown"
        ></textarea>
        <div class="button-container">
          <button class="clear-btn" @click="clearText">Clear</button>
          <button class="copy-btn" @click="copyToClipboard">Copy</button>
          <button class="download-btn" @click="downloadText">Download</button>
          <v-switch
            v-model="autoReplace"
            color="primary"
            label="Auto-replace variants"
            class="ms-4"
          ></v-switch>
          <v-btn @click="toggleTheme">{{ theme.global.name.value === 'dark' ? 'Light Mode' : 'Dark Mode' }}</v-btn>
        </div>

        <!-- Move the keyboard-map section above the keys section -->
        <div class="keyboard-map">
          <div v-for="(row, index) in keyboardLayout" :key="index" class="key-row">
            <div v-for="key in row" :key="key.char" class="key-mapping">
              <span class="keyboard-key">{{ key.char }}</span>
              <span class="indus">{{ key.sign }}</span>
            </div>
          </div>
        </div>

        <!-- Add clickable keys section -->
        <div class="keys">
          <button 
            v-for="(sign, index) in canonicalForms" 
            :key="index" 
            @click="addCharacter(sign)" 
            class="indus-key"
          >
            {{ sign }}
          </button>
        </div>
        <!-- <div>Total Canonical Forms: {{ canonicalFormsCount }}</div> -->
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { canonicalForms } from '@/pages/signs.vue'
import symbolFrequency from '@/assets/data/symbol-frequency.json'
import HeaderLinks from "@/components/HeaderLinks.vue"
import { useTheme } from "vuetify"
import { copyToClipboard, downloadText } from '@/components/screenshot.vue'

const theme = useTheme();
theme.global.name.value = localStorage.getItem("theme") || "dark";

const inputText = ref('')
const autoReplace = ref(true)

// Create keyboard mapping with canonical forms
const keyboardChars = [
  'ABCDEFGHIJKLM',
  'NOPQRSTUVWXYZ',
  'abcdefghijklm',
  'nopqrstuvwxyz',
  '0123456789[]'
].map(row => row.split(''))

// Build reverse mapping from indus characters to their canonical forms
const canonicalMap = Object.entries(symbolFrequency).reduce((acc, [char, _]) => {
  const canonical = canonicalForms.find(canon => 
    Object.entries(symbolFrequency).some(([c, freq]) => 
      freq > (symbolFrequency[char] || 0) && 
      c.toString() === canon.toString()
    )
  )
  if (canonical) {
    acc[char] = canonical
  }
  return acc
}, {})

const keyboardLayout = computed(() => {
  return keyboardChars.map(row => 
    row.map((char, i) => ({
      char,
      sign: canonicalForms[keyboardChars.flat().indexOf(char)] || ''
    }))
  )
})

const charToSignMap = computed(() => {
  const map = {}
  keyboardChars.flat().forEach((char, i) => {
    if (canonicalForms[i]) {
      map[char] = canonicalForms[i]
    }
  })
  return map
})

function handleKeyDown(e) {
  const char = e.key
  if (charToSignMap.value[char]) {
    e.preventDefault()
    addCharacter(charToSignMap.value[char])
  }
}

function addCharacter(character) {
  inputText.value += character
}

function clearText() {
  inputText.value = ''
}

function toggleTheme() {
  theme.global.name.value = theme.global.name.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem("theme", theme.global.name.value);
}

// Enhanced variant replacement logic
watch(inputText, (newValue, oldValue) => {
  if (!autoReplace.value) return
  
  const lastChar = newValue.slice(-1)
  const prevChar = newValue.slice(-2, -1)
  
  if (lastChar && prevChar) {
    let bestVariant = null
    let maxFreq = 0

    // Check all possible variants and their frequencies
    Object.entries(symbolFrequency).forEach(([char1, connections]) => {
      if (canonicalMap[char1] === prevChar) {
        Object.entries(connections).forEach(([char2, freq]) => {
          if (canonicalMap[char2] === lastChar && freq > maxFreq) {
            maxFreq = freq
            bestVariant = char2
          }
        })
      }
    })

    if (bestVariant) {
      inputText.value = newValue.slice(0, -1) + bestVariant
    }
  }
})

const canonicalFormsCount = computed(() => canonicalForms.length)

onMounted(() => {
  setTimeout(function () {
    const splashScreen = document.querySelector(".splash");
    if (splashScreen) splashScreen.classList.add("hidden");
  }, 100);
});
</script>

<style scoped>
.typing-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.indus-input {
  font-family: indus_scriptregular;
  font-size: 24pt;
  padding: 15px;
  border: 2px solid #ccc;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
  resize: vertical;
}

.button-container {
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
}

.clear-btn, .copy-btn, .download-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear-btn {
  background-color: #ff4444;
  color: white;
}

.clear-btn:hover {
  background-color: #cc0000;
}

.copy-btn {
  background-color: #4CAF50;
  color: white;
}

.copy-btn:hover {
  background-color: #45a049;
}

.download-btn {
  background-color: #008CBA;
  color: white;
}

.download-btn:hover {
  background-color: #007bb5;
}

.keys {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
  width: 100%;
  max-width: 800px;
  justify-content: center;
}

.indus-key {
  font-family: indus_scriptregular;
  font-size: 24pt;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f5f5f5;
}

.indus-key:hover {
  background-color: #e0e0e0;
}

.keyboard-map {
  border-top: 1px solid #ccc;
  padding-top: 20px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.key-mapping {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 40px;
}

.keyboard-key {
  font-size: 12px;
  color: #666;
}

.indus {
  font-family: indus_scriptregular;
  font-size: 20pt;
}
</style>