# components/SLP1Input.vue
<template>
  <div class="slp1-input">
    <v-textarea
      v-model="inputText"
      class="mb-2 textarea"
      clearable
      auto-grow
      rows="3"
      label="Enter SLP1 text"
      placeholder="Example: rAma or ziva"
      @update:model-value="handleInput"
    ></v-textarea>

    <!-- Preview Section -->
    <div v-if="devanagariText" class="preview-section">
      <div class="preview-item">
        <div class="preview-label">Devanagari:</div>
        <div class="preview-text sanskrit">{{ devanagariText }}</div>
      </div>
      <div class="preview-item">
        <div class="preview-label">IAST:</div>
        <div class="preview-text">{{ iastText }}</div>
      </div>
    </div>

    <!-- Quick Reference Panel -->
    <v-expansion-panels class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          SLP1 Quick Reference Guide
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="reference-section">
            <div v-for="(section, index) in quickReference" :key="index" class="reference-group">
              <div class="reference-title">{{ section.title }}</div>
              <div class="reference-items">
                <div v-for="(item, itemIndex) in section.items" :key="itemIndex" class="reference-item">
                  <span class="slp1">{{ item.slp1 }}</span>
                  <span class="arrow">→</span>
                  <span class="devanagari">{{ item.dev }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sanscript from '@indic-transliteration/sanscript'

const emit = defineEmits(['text-change'])
const inputText = ref('')
const devanagariText = ref('')
const iastText = ref('')

// Organized quick reference for common SLP1 characters
const quickReference = [
  {
    title: 'Simple Vowels',
    items: [
      { slp1: 'a', dev: 'अ' },
      { slp1: 'A', dev: 'आ' },
      { slp1: 'i', dev: 'इ' },
      { slp1: 'I', dev: 'ई' },
      { slp1: 'u', dev: 'उ' },
      { slp1: 'U', dev: 'ऊ' }
    ]
  },
  {
    title: 'Complex Vowels',
    items: [
      { slp1: 'f', dev: 'ऋ' },
      { slp1: 'F', dev: 'ॠ' },
      { slp1: 'e', dev: 'ए' },
      { slp1: 'E', dev: 'ऐ' },
      { slp1: 'o', dev: 'ओ' },
      { slp1: 'O', dev: 'औ' }
    ]
  },
  {
    title: 'Velar Consonants',
    items: [
      { slp1: 'k', dev: 'क' },
      { slp1: 'K', dev: 'ख' },
      { slp1: 'g', dev: 'ग' },
      { slp1: 'G', dev: 'घ' },
      { slp1: 'N', dev: 'ङ' }
    ]
  },
  {
    title: 'Palatal Consonants',
    items: [
      { slp1: 'c', dev: 'च' },
      { slp1: 'C', dev: 'छ' },
      { slp1: 'j', dev: 'ज' },
      { slp1: 'J', dev: 'झ' },
      { slp1: 'Y', dev: 'ञ' }
    ]
  },
  {
    title: 'Retroflex Consonants',
    items: [
      { slp1: 'w', dev: 'ट' },
      { slp1: 'W', dev: 'ठ' },
      { slp1: 'q', dev: 'ड' },
      { slp1: 'Q', dev: 'ढ' },
      { slp1: 'R', dev: 'ण' }
    ]
  },
  {
    title: 'Dental Consonants',
    items: [
      { slp1: 't', dev: 'त' },
      { slp1: 'T', dev: 'थ' },
      { slp1: 'd', dev: 'द' },
      { slp1: 'D', dev: 'ध' },
      { slp1: 'n', dev: 'न' }
    ]
  },
  {
    title: 'Labial Consonants',
    items: [
      { slp1: 'p', dev: 'प' },
      { slp1: 'P', dev: 'फ' },
      { slp1: 'b', dev: 'ब' },
      { slp1: 'B', dev: 'भ' },
      { slp1: 'm', dev: 'म' }
    ]
  },
  {
    title: 'Semivowels & Liquids',
    items: [
      { slp1: 'y', dev: 'य' },
      { slp1: 'r', dev: 'र' },
      { slp1: 'l', dev: 'ल' },
      { slp1: 'v', dev: 'व' }
    ]
  },
  {
    title: 'Sibilants & Aspirate',
    items: [
      { slp1: 'z', dev: 'श' },
      { slp1: 'S', dev: 'ष' },
      { slp1: 's', dev: 'स' },
      { slp1: 'h', dev: 'ह' }
    ]
  },
  {
    title: 'Anusvara & Visarga',
    items: [
      { slp1: 'M', dev: 'ं' },
      { slp1: 'H', dev: 'ः' }
    ]
  }
]

const handleInput = () => {
  try {
    if (!inputText.value) {
      devanagariText.value = ''
      iastText.value = ''
      emit('text-change', { devanagari: '', iast: '', forIndus: '' })
      return
    }

    // Convert SLP1 to Devanagari
    devanagariText.value = Sanscript.t(inputText.value, 'slp1', 'devanagari')
    // Also convert to IAST for reference
    iastText.value = Sanscript.t(inputText.value, 'slp1', 'iast')
    
    // Emit both the original and converted text
    emit('text-change', {
      slp1: inputText.value,
      devanagari: devanagariText.value,
      iast: iastText.value,
      forIndus: devanagariText.value
    })
  } catch (error) {
    console.error('Conversion error:', error)
  }
}
</script>

<style scoped>
.slp1-input {
  width: 100%;
  margin: 0 auto;
}

.textarea {
  width: 100% !important;
}

.preview-section {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  width: 100%;
}

.preview-item {
  margin: 0.5rem 0;
  width: 100%;
}

.preview-label {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.preview-text {
  font-size: 1.2rem;
  margin-top: 0.25rem;
  width: 100%;
}

.reference-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
}

.reference-group {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-bottom: 1rem;
}

.reference-title {
  font-weight: 500;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.reference-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.reference-item {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
}

.slp1 {
  font-family: monospace;
  font-size: 1.1rem;
  min-width: 1ch;
}

.arrow {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.devanagari {
  font-size: 1.2rem;
  min-width: 1ch;
}

:deep(.v-textarea) {
  width: 100% !important;
}
</style>