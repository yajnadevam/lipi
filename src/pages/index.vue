<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        location="right"
        temporary
      >
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
          title="Indus Script"
        ></v-list-item>
        <v-fab @click.stop="drawer = !drawer"
        :key="activeFab.icon"
        :color="activeFab.color"
        :icon="activeFab.icon"
        class="ms-4 mb-4"
        location="top right"
        size="40"
        absolute
        app
        appear
      ></v-fab>
        <v-divider></v-divider>

        <v-list density="compact" nav>
          <!-- <v-list-item prepend-icon="mdi-view-dashboard" title="Home" value="home"></v-list-item>
          <v-list-item prepend-icon="mdi-forum" title="About" value="about"></v-list-item> -->
          <Key />
        </v-list>
      </v-navigation-drawer>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
  <v-data-table
    v-model:expanded="expanded"
    :custom-filter="filterInscriptions"
    :headers="headers"
    item-value="id"
    :items="filtered"
    :search="search"
    show-expand
  >
    <template v-slot:top>
      <v-text-field
        v-model="search"
        class="pa-2 indus"
        label="Search Indus valley inscriptions"
      ></v-text-field>
    </template>
    <!-- <template v-slot:item="props">
      <template v-if="!props.item.show">
      </template>
    </template> -->

    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <!-- <td :colspan="columns.length">
          More info about {{ item.description }}
        </td> -->
        <td></td><td>{{ item.site }}</td><td style="text-align: right;">{{ item.description }}</td><td></td>
      </tr>
    </template>
  </v-data-table>
        <v-fab @click.stop="drawer = !drawer"
        :key="activeFab.icon"
        :color="activeFab.color"
        :icon="activeFab.icon"
        class="ms-4 mb-4"
        location="top right"
        size="40"
        absolute
        app
        appear
      ></v-fab>
        </div>
      </v-main>
    </v-layout>
  </v-card>
  <!-- <v-bottom-sheet>
  <template v-slot:activator="{ props }">
    <v-btn v-bind="props" text="Click Me"></v-btn>
  </template>

  <v-card
    title="Bottom Sheet"
    text="Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ut, eos? Nulla aspernatur odio rem, culpa voluptatibus eius debitis dolorem perspiciatis asperiores sed consectetur praesentium! Delectus et iure maxime eaque exercitationem!"
  ></v-card>
</v-bottom-sheet> -->
</template>

<script>
  import { csv2json } from 'json-2-csv'
  import Key from '../components/Key.vue'
  import Ichar from '../components/ichar.vue'
  import Schar from '../components/schar.vue'
  import sanskrittransliterate from 'devanagari-transliterate'
  import incx from '../assets/data/inscriptions.csv?raw'
  import xlits from '../assets/data/xlits.csv?raw'
  // import mw from '../assets/data/mw.txt?raw'

  const inx = csv2json(incx, { keys: ['id', 'cisi', 'site', 'complete', 'text', 'sanskrit', 'translation'] })
  const xlitarray = csv2json(xlits)
  const borders = {
    L: { ']': '\uE3E5', '+': '' }, //'\uE3E3' },
    R: { '[': '\uE3E6', '+': '' }, //'\uE3E4' },
  }

  const xlitmap = {}
  xlitarray.forEach(element => {
    xlitmap[element.sign] = {}
    xlitmap[element.sign].xlit = element.xlit
    xlitmap[element.sign].canonical = element.canonical
    xlitmap[element.sign].regex = element.regex || element.xlit
  })

  xlitarray.forEach(element => {
    mkregex(xlitmap[element.sign])
  })

  inx.forEach(el => {
    const analyzed = xlitize(el.text)
    el.description = analyzed.str
    el.regex = analyzed.regex
    el.text = jsize(el.text)
    el.sanskrit = sanskrittransliterate('SLP', 'latin2devanagari', el.sanskrit)
              + '\n' + sanskrittransliterate('SLP', 'latin2ISO', el.sanskrit)
    // const regex = new RegExp('^' + el.regex + '$', 'smg')
    // const matches = mw.match(regex)
    // el.best = matches === null ? '' : matches[0]
  })

  function jsize (text) {
    text = text.trim()
    const slices = text.split(/\//).reverse()
    if (slices === null) return ''
    const jslices = slices.map($item => { return jsizepart($item) })
    const L = borders.L[text.charAt(0)]
    const R = borders.R[text.charAt(text.length - 1)]
    if (R === undefined) {
      console.log(text)
    }

    if (jslices[0]) jslices[0] = L + jslices[0]
    if (jslices[jslices.length - 1]) jslices[jslices.length - 1] += R
    return jslices.join('\n')
  }

  function jsizepart (text) {
    const re = /(\d+)/g
    const results = text.match(re)
    let str = ''
    results.forEach(row => {
      str += '\\u' + (0xE000 + parseInt(row)).toString(16)
    })
    return JSON.parse('"' + str + '"')
  }

  function mkregex (element) {
    if (!element.canonical || !(typeof (element.canonical) === 'string')) {
      if (!xlitmap[element.canonical]) {
        return console.log('No xlit for', element, element.canonical)
      }
      element.xlit = xlitmap[element.canonical].xlit
      element.regex = element.xlit
      return
    }

    const list = element.canonical.split('-').reverse()
    let regex = ''; let lit = ''
    list.forEach(item => {
      const sign = xlitmap[item]
      if (sign) {
        lit += sign.xlit
        regex += (sign.regex || sign.xlit)
      } else {
        console.log('no xlit for', item)
      }
    })
    element.xlit = element.xlit || lit
    element.regex = element.regex || regex
    return regex
  }

  function xlitize (text) {
    const re = /(\d+)/g
    const results = text.match(re) //.reverse()
    if (xlitmap[results[0]] === undefined) {
      return console.log('Warning: Missing sign', results[0])
    }
    let str = xlitmap[results[0]].xlit
    let regex = str
    results.shift()
    results.forEach(row => {
      const sign = xlitmap[row]
      if (sign) {
        if (str.match(/^.*([iu]|an|as)$/) == null && sign.xlit.match(/^[aiu]$/) == null && !str.endsWith('.')) {
          str += 'a'
          regex += 'a?'
        }
        str += '-' + sign.xlit
        regex += sign.xlit
      } else {
        console.log('Warning: Missing sign', row)
      }
    })
    if (str.match(/.*([iu]|an|as)$/) === null) {
      str += 'a'
      regex += 'a?'
    }
    return { str, regex }
  }

  export default {
    components: { Ichar, Schar, Key },
    data () {
      return {
        search: '',
        drawer: null,
        expanded: [],
        headers: [
          { title: 'Seal ID', key: 'id' },
          { title: 'CISI ID', key: 'cisi' },
          { title: 'Inscription', key: 'text', align: 'end', cellProps: { class: 'indus' } },
          // { title: 'Transliteration', key: 'description' },
          // { title: 'Regex', key: 'regex' },
          { title: 'Sanskrit', key: 'sanskrit', cellProps: { class: 'sanskrit' } },
          // { title: 'IAST', key: 'iast' },
          { title: 'Translation', key: 'translation' },
          { title: '', key: 'data-table-expand' },
        ],
        items: inx,
      }
    },
    computed: {
      activeFab () {
        return this.drawer ? { color: 'lightgrey', icon: 'mdi-chevron-right' }
          : { color: 'lightgrey', icon: 'mdi-chevron-left' }
      },
      filtered () {
        return this.items.filter(e => e.complete === 'Y')
      },
    },

    methods: {
      filterInscriptions (value, query, item) {
        return (
          value != null &&
          query != null &&
          item.raw.complete === 'Y' &&
          typeof value === 'string' &&
          value.toString().toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1
        )
      },
    },
  }

  const filtered = computed(() =>
    data.value.filter(e => e.raw.complete === 'Y')
  )

</script>

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
        .sanskrit {
            white-space: pre;
        }
</style>
