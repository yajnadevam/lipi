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
        src: url('../assets/fonts/indus-font.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-size: 24pt;
        font-display: swap;
        }
        .indus {
            font-family: indus_scriptregular; font-size: 24pt;
            white-space: pre;
            font-display: swap;
        }
</style>
