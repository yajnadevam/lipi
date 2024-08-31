<script setup>
  defineProps(['value'])
</script>

<template>
  <span class="indus">{{ value }}</span>
</template>

<style>
        @font-face {
        font-family: 'indus_scriptregular';
        src: url('../assets/fonts/indus-font.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-size: 24pt;
        }
        .indus {
            font-family: indus_scriptregular; font-size: 24pt;
        }
</style>
