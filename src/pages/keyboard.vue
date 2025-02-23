<template>
  <!--Header-->
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
  </v-toolbar>
  <HeaderLinks />

  <v-card>
    <v-layout>
      <v-main>
        <div class="d-flex justify-center align-center h-100 container">
          <!-- Input Method Selector -->
          <InputSelector @input-change="handleInputMethodChange" />

          <!-- Input Area -->
          <div v-if="inputMethod === 'slp1'" class="full-width">
            <SLP1Input @text-change="handleTextChange" />
          </div>
          <div v-else class="full-width">
            <v-textarea
              v-model="textareaValue"
              class="container-item textarea"
              @update:model-value="translate"
              no-resize=""
              placeholder="Type in Devanagari. Eg: ॐ रुद्राय नमः"
              autofocus
            >
            </v-textarea>
          </div>

          <div class="attribution">
            Powered by
            <a target="_blank" href="https://github.com/ram-g-athreya/Indus-Input-Font">
              Indus Input Font
            </a>
          </div>

          <!-- Right to Left Below: -->
          <div class="output-container rtl">
            <span class="indus-input">{{ translation }}</span>
          </div>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import InputSelector from '../components/InputSelector.vue'
import SLP1Input from '../components/SLP1Input.vue'
import HeaderLinks from '../components/HeaderLinks.vue'

const theme = useTheme()
theme.global.name.value = localStorage.getItem('theme') || 'dark'

const inputMethod = ref(localStorage.getItem('inputMethod') || 'devanagari')
const textareaValue = ref('')
const translation = ref('')

const handleInputMethodChange = (method) => {
  inputMethod.value = method
  textareaValue.value = ''
  translation.value = ''
}

const handleTextChange = (text) => {
  // We now use forIndus which is formatted for Indus font conversion
  if (text.forIndus) {
    translate(text.forIndus)
  } else {
    translate(text.devanagari)
  }
}

const translate = (value) => {
  if (!value) return
  translation.value = value.split('\n').join(' \n')
}

onMounted(() => {
  setTimeout(() => {
    const splashScreen = document.querySelector('.splash')
    if (splashScreen) splashScreen.classList.add('hidden')
  }, 100)
})
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
  font-family: indus_input  !important;
  font-size: 24pt;
  white-space: pre;
  font-variant-ligatures: discretionary-ligatures;
}

.indus-input:after {
  content: " ";
}

.indus-input:before {
  content: " ";
}

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
  width: 100%;
}

.full-width {
  width: 100%;
}

.container-item {
  flex: auto;
  width: 100%;
}

.textarea {
  width: 100% !important;
}

.attribution {
  width: 100%;
  font-size: 10pt;
  text-align: right;
  margin-bottom: 15pt;
}

.attribution a {
  color: inherit;
}

.textarea .v-input__details {
  display: none;
}

.rtl {
  transform: scale(-1, 1);
  text-align: left;
  width: 100%;
}

.output-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.output-container span {
  overflow: auto;
  width: 100%;
}
</style>