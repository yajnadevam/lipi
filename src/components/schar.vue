<script setup>
  defineProps(['value'])
</script>

<template>
  <span class="sanskrit">{{ value }}</span>
</template>

<style scoped>
        @font-face {
        font-family: 'devanagariregular';
        src: url('../assets/fonts/NotoSerifDevanagari.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-size: 24pt;
        }
        .indus {
            font-family: devanagariregular; font-size: 24pt; color: black;
        }
</style>
