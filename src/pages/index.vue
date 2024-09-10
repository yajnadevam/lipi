<template>
  <v-toolbar>
    <v-img aspect-ratio="1" src="../assets/sarasvati.png"></v-img>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
    <v-menu :close-on-content-click="false" :close-delay="2000" :open-on-hover="true">
      <template v-slot:activator="{ props }">
      <v-btn  v-bind="props" icon>
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
          <v-list-item-title><v-switch v-model="optionCanonical" color="primary" label="Canonical" value="Canonical"></v-switch></v-list-item-title>
          <v-list-item-title><v-switch v-model="optionBroken" color="red" label="Include Broken" value="Broken"></v-switch></v-list-item-title>
      </v-list>
    </v-menu>
      
    <v-btn icon>
        <v-icon>mdi-cog-outline</v-icon>
      </v-btn>
  </v-toolbar>
      <v-navigation-drawer
        v-model="drawer"
        location="right"
        temporary
      >
        <v-list-item
          title="Allograph values"
        ></v-list-item>
        <v-fab @click.stop="drawer = !drawer"
        :key="activeFab.icon"
        :color="activeFab.color"
        :icon="activeFab.icon"
        class="ms-1 mb-1"
        location="top right"
        size="40"
        app
        appear
      ></v-fab>
        <v-divider></v-divider>

        <v-list density="compact" nav>
          <Key />
        </v-list>
      </v-navigation-drawer>
        <v-fab @click.stop="drawer = !drawer"
        :key="activeFab.icon"
        :color="activeFab.color"
        :icon="activeFab.icon"
        class="ms-1 mb-1"
        location="top right"
        size="40"
        absolute
        app
        appear
      ></v-fab>

  <v-card>
    <v-layout>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
  <v-data-table
    v-model:expanded="expanded"
    :custom-filter="filterInscriptions"
    :headers="computedHeaders"
    item-value="id"
    :items="filtered"
    :page="pageNum"
    :row-props="itemrow"
    :search="search"
    show-expand
    @update:page="pageChange"
  >
    <template #top>
      <v-text-field
        v-model="search"
        class="pa-2"
        label="Search Indus valley inscriptions"
      />
    </template>

    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <td></td><td>{{ item.site }}</td><td style="text-align: right;">{{ item.description }}</td><td></td>
      </tr>
    </template>
  </v-data-table>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script>
  import { csv2json } from 'json-2-csv'
  import Key from '../components/Key.vue'
  import Ichar from '../components/ichar.vue'
  import Schar from '../components/schar.vue'
  import sanskrittransliterate from 'devanagari-transliterate'
  import incx from '../assets/data/inscriptions.csv?raw'
  import xlits from '../assets/data/xlits.csv?raw'

  const inx = csv2json(incx, { keys: ['id', 'cisi', 'site', 'complete', 'text', 'sanskrit', 'translation'] })
  const xlitarray = csv2json(xlits)

  const canonMap = {}
  const xlitmap = {}
  xlitarray.forEach(element => {
    xlitmap[element.sign] = {}
    xlitmap[element.sign].xlit = element.xlit
    xlitmap[element.sign].canonical = element.canonical
    xlitmap[element.sign].regex = element.regex || element.xlit
    canonMap[characterize(element.sign)] = characterize(element.canonical)
  })

  xlitarray.forEach(element => {
    mkregex(xlitmap[element.sign])
  })

  inx.forEach(el => {
    const analyzed = xlitize(el.text)
    el.description = analyzed.str
    el.regex = analyzed.regex
    const canonized = canonize(el.text)
    el.text = canonized.str // jsize(el.text)
    el.canonized = canonized.canon
    el.sanskrit = sanskrittransliterate('SLP', 'latin2devanagari', el.sanskrit)
              + '\n' + sanskrittransliterate('SLP', 'latin2ISO', el.sanskrit)
  })

  function canonized (text) {
    let canonizedStr = ''
    for (let i = 0; i < text.length; i++) {
      canonizedStr += canonMap[text.charAt(i)]
    }
    return canonizedStr
  }

  function characterize (points) {
    const charset = points.toString().split('-')
    let result = ''
    charset.forEach(point => {
      result += '\\u' + (0xE000 + parseInt(point)).toString(16)
    })
    return JSON.parse('"' + result + '"')
  }

  function canonize (text) {
    text = text.replace('/', '-999-999-999-999-')
    const re = /(\d+)/g
    const results = text.match(re)
    let str = ''
    let canon = ''
    results.forEach(row => {
      const thisChar = '\\u' + (0xE000 + parseInt(row)).toString(16)
      str += thisChar
      if (row !== xlitmap[row].canonical) {
        if (!xlitmap[row].canonical) return row
        const canel = xlitmap[row].canonical.toString().split('-')
        canon += canel.map(a => {
          return '\\u' + (0xE000 + parseInt(a)).toString(16)
        }).join('')
      } else {
        canon += thisChar
      }
    })
    str = JSON.parse('"' + str + '"')
    canon = JSON.parse('"' + canon + '"')
    return { str, canon }
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
    const results = text.match(re).reverse()
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
    str = str.split('-').reverse().join('-')
    return { str, regex }
  }

  export default {
    components: { Key },
    data () {
      return {
        search: '',
        drawer: null,
        pageNum: 1,
        expanded: [],
        headers: [
          { title: 'Seal ID', key: 'id' },
          { title: 'CISI ID', key: 'cisi' },
          { title: 'Inscription', key: 'canonized', align: 'end', cellProps: { class: 'indus' } },
          { title: 'Transliteration', key: 'description', align: ' d-none' },
          { title: 'Sanskrit', key: 'sanskrit', cellProps: { class: 'sanskrit' } },
          { title: 'Translation', key: 'translation' },
          { title: '', key: 'data-table-expand' },
        ],
        items: inx,
        optionCanonical: '',
        optionBroken: '',
      }
    },
    computed: {
      activeFab () {
        return this.drawer ? { color: 'white', icon: 'mdi-chevron-right' }
          : { color: 'green', icon: 'mdi-chevron-left' }
      },
      filtered () {
        return this.items.filter(e => this.optionBroken || e.complete === 'Y')
      },
      computedHeaders () {
        this.headers.forEach(h => {
          if (h.title === 'Inscription') {
            h.key = this.optionCanonical ? 'canonized' : 'text'
          }
        })
        return this.headers
      },
    },

    methods: {
      filterInscriptions (value, query, item) {
        return (
          value != null &&
          query != null &&
          ((this.optionBroken && item.raw.complete === 'N') || item.raw.complete === 'Y') &&
          typeof value === 'string' &&
          ((value.toString().toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1) ||
          (query.length > 0 && query.charCodeAt(0) >= 0xE000 && canonized(value).indexOf(canonized(query)) !== -1))
        )
      },
      itemrow (item) {
        return item.item.complete === 'Y' ? { class: 'text-white' } : { class: 'text-red' }
      },
      pageChange (newPage) {
        localStorage.setItem('page', newPage)
        this.pageNum = newPage
      },
    },
    created () {
      this.pageNum = localStorage.getItem('page')
    },
  }

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
        .v-text-field input {
            font-family: indus_scriptregular; font-size: 24pt;
        }
</style>
