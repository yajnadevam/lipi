<template>
  <div class="input-selector">
    <v-btn-toggle
      v-model="selectedInput"
      mandatory
      @update:model-value="handleInputChange"
    >
      <v-btn value="devanagari">
        <v-icon>mdi-alphabet-devanagari</v-icon>
        Devanagari
      </v-btn>
      <v-btn value="slp1">
        <v-icon>mdi-keyboard</v-icon>
        SLP1
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['input-change'])
const selectedInput = ref('devanagari') // Default to devanagari

// Load saved preference if exists
const savedPreference = localStorage.getItem('inputMethod')
if (savedPreference) {
  selectedInput.value = savedPreference
}

const handleInputChange = (value) => {
  localStorage.setItem('inputMethod', value)
  emit('input-change', value)
}
</script>

<style scoped>
.input-selector {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}
</style>