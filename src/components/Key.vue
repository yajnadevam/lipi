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
    // it.varna += '\n' + it.letter
    it.glyphs = JSON.parse('"' + it.glyphs + '"')
  })
  const dheaders = [
    { title: 'L', key: 'varna', cellProps: { class: 'sanskrit1' } },
    // { title: 'Name', key: 'id', cellProps: { class: 'sanskrit' } },
    { title: 'Glyphs', key: 'glyphs', cellProps: { class: 'indus1' } },
  ]
</script>

<style>
        @font-face {
        font-family: 'indus_scriptregular';
        src: url('../assets/fonts/indus-font.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-size: 24pt;
        }
        .indus1 {
            font-family: indus_scriptregular; font-size: 9pt;
            white-space: pre;
            height: 18px !important;
        }
        .sanskrit1 {
            white-space: pre;
            height: 18px !important;
        }
</style>
