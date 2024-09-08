<script setup>
  defineProps(['value', 'xlit'])
</script>

<template>
    <table>
    <tr><td class="indus">{{ value }}</td></tr>
    <tr><td class="xlit">{{ xlit }}</td></tr>
    </table>
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
            white-space: pre;
        }
</style>
