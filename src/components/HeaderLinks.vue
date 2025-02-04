<template>
  <div class="header-links v-theme">
    <a href="/" class="header-link">Home</a>
    <a href="/signs" class="header-link">Signs</a>
    <button v-if="search" @click="captureSearchBoxScreenshot">Screenshot Search</button>
  </div>
  <v-divider />
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  search: String
})

const captureSearchBoxScreenshot = async () => {
  try {
    const searchBox = document.querySelector('#search')
    if (!searchBox) {
      console.error("Search box not found")
      return
    }

    const searchText = searchBox.value
    if (!searchText) {
      console.error("No text found in search box")
      return
    }

    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas')
    const context = tempCanvas.getContext('2d')
    tempCanvas.width = searchBox.offsetWidth
    tempCanvas.height = searchBox.offsetHeight

    // Copy computed styles from the search box to the canvas context
    const computedStyles = getComputedStyle(searchBox)
    context.font = computedStyles.font
    context.textAlign = computedStyles.textAlign
    context.textBaseline = 'top'
    context.fillStyle = computedStyles.color

    // Draw text onto the canvas
    context.fillText(searchText, 0, 0)

    // Convert the canvas to a Blob
    tempCanvas.toBlob(async (blob) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'screenshot.png'
      link.click()
      URL.revokeObjectURL(link.href)

      try {
        const clipboardItem = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([clipboardItem])
        alert('Screenshot copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy screenshot', err)
      }
    }, 'image/png')
  } catch (err) {
    console.error('Error capturing screenshot:', err)
  }
}
</script>

<style>
.header-links {
  padding: 12px 10px;
}
.header-link {
  margin-right: 15px;
  text-decoration: none;
}
.header-link:hover {
  margin-right: 15px;
  text-decoration: underline;
}
.header-link:visited {
  text-decoration: none;
  color: inherit;
}
</style>
