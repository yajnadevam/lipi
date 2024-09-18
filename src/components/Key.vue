<template>
    <v-data-table
    :headers="dheaders"
    :items="items"
    :items-per-page="itemsPerPage"
    density="compact"
    item-key="id"
    hide-default-header
    hide-default-footer
    ></v-data-table>

</template>

<script setup>
  import { csv2json } from 'json-2-csv'
  import decipher from '../assets/data/decipher.csv?raw'

  const itemsPerPage = 100
  const items = csv2json(decipher)
  items.forEach(it => {
    it.id += ' ' + it.name
    it.varna += (it.varna.length === 1 ? ' ' : '\n') + it.letter
    it.glyphs = JSON.parse('"' + it.glyphs + '"')
  })
  const dheaders = [
    { title: 'L', key: 'varna', cellProps: { class: 'sanskrit1' } },
    { title: 'Glyphs', key: 'glyphs', cellProps: { class: 'indus1' } },
  ]
</script>

<style>
        @font-face {
        font-family: 'indus_scriptregular';
        src: url('../assets/fonts/indus-font.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-size: 24pt;
        font-display: swap;
        }
        .indus1 {
            font-family: indus_scriptregular; font-size: 12pt;
            white-space: pre;
            height: 30px !important;
            font-display: swap;
        }
        .sanskrit1 {
            font-size: 7pt;
            white-space: pre;
            height: 30px !important;
            font-display: swap;
        }
</style>
