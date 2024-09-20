<template>
  <v-toolbar>
    <h1 class="indus" style="margin: 10px;"></h1>
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
    <v-menu :close-on-content-click="false" :close-delay="2000" :open-on-hover="true">
      <template v-slot:activator="{ props }">
      <v-btn  v-bind="props" icon>
          <v-icon :icon="icons.cog"></v-icon>
        </v-btn>
      </template>
      <v-list style="padding: 4px;">
          <v-list-item-title>
            <v-switch 
                v-model="optionCanonical" 
                color="primary" 
                label="Canonical" 
                @update:model-value="persistCanonical"
              >
            </v-switch></v-list-item-title>
          <v-list-item-title>
            <v-switch 
              v-model="optionBroken" 
              color="red" 
              label="Include Broken"
              @update:model-value="persistBroken"
            >
            </v-switch>
          </v-list-item-title>
          <v-list-item-title>
            <v-switch 
              v-model="lightTheme"
              color="primary" 
              label="Light Theme"
              @update:model-value="toggleTheme"
            >
            </v-switch>
          </v-list-item-title>
      </v-list>
    </v-menu>
      
    <v-btn icon>
        <v-icon :icon="activeFab.icon"></v-icon>
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
    :first-icon="icons.pageFirst"
    :last-icon="icons.pageLast"
    :next-icon="icons.chevRight"
    :prev-icon="icons.chevLeft"
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

    <template v-slot:item.data-table-expand="{item, isExpanded}">
      <v-icon v-if="isExpandedRow(item.id)" :icon="icons.collapse" @click="handleExpansion(item, isExpanded)"></v-icon>
      <v-icon v-else :icon="icons.expand" @click="handleExpansion(item, isExpanded)"></v-icon>

    </template>

    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <td></td><td>{{ item.site }}</td><td></td><td style="text-align: right;">{{ item.description }}</td><td></td><td>{{ item.notes }}</td>
      </tr>
    </template>
  </v-data-table>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
  import { useTheme } from 'vuetify'
  const theme = useTheme()
  theme.global.name.value = localStorage.getItem('theme') || 'dark'

  function toggleTheme () {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
    localStorage.setItem('theme', theme.global.name.value)
  }

</script>
<script>
  import { csv2json } from 'json-2-csv'
  import Key from '../components/Key.vue'
  import sanskrittransliterate from 'devanagari-transliterate'
  import incx from '../assets/data/inscriptions.csv?raw'
  import xlits from '../assets/data/xlits.csv?raw'

  const inx = csv2json(incx, { keys: ['id', 'cisi', 'site', 'complete', 'text', 'text length', 'sanskrit', 'translation', 'notes'] })
  const xlitarray = csv2json(xlits)

  const canonMap = {}
  const xlitmap = {}
  const inxMap = {}

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
    el.textlength = parseInt(el['text length'])
    el.canonized = canonized.canon
    if (el.sanskrit) {
      if (el.sanskrit.startsWith('ref:')) {
        Object.assign(el, resolve(el.sanskrit))
      } else {
        el.sanskrit = sanskrittransliterate('SLP', 'latin2devanagari', el.sanskrit)
              + '\n' + sanskrittransliterate('SLP', 'latin2ISO', el.sanskrit)
      }
    } else {
      el.sanskrit = '*' + el.description.replaceAll('-', '')
    }
    inxMap[el.id] = el
  })

  function resolve(ref) {
    const referred = inxMap[ref.substring(4)]
    if (!referred) return console.log('Failed to find reference', ref)
    return { sanskrit: referred.sanskrit, translation: referred.translation }
  }

  function canonized (text) {
    let canonizedStr = ''
    for (let i = 0; i < parseInt(text.length); i++) {
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
    text = text.replaceAll('/', '-999-999-999-999-')
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
    str = str.split('-').join('-')
    return { str, regex }
  }

  export default {
    components: { Key },
    data () {
      return {
        icons: {
          pageFirst: ['M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z'],
          pageLast: ['M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z'],
          chevLeft: ['M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z'],
          chevRight: ['M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z'],
          expand: ['M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z'],
          collapse: ['M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z'],
          cog: ['M 12 15.5 A 3.5 3.5 0 0 1 8.5 12 A 3.5 3.5 0 0 1 12 8.5 A 3.5 3.5 0 0 1 15.5 12 A 3.5 3.5 0 0 1 12 15.5 M 19.43 12.97 C 19.47 12.65 19.5 12.33 19.5 12 C 19.5 11.67 19.47 11.34 19.43 11 L 21.54 9.37 C 21.73 9.22 21.78 8.95 21.66 8.73 L 19.66 5.27 C 19.54 5.05 19.27 4.96 19.05 5.05 L 16.56 6.05 C 16.04 5.66 15.5 5.32 14.87 5.07 L 14.5 2.42 C 14.46 2.18 14.25 2 14 2 H 10 C 9.75 2 9.54 2.18 9.5 2.42 L 9.13 5.07 C 8.5 5.32 7.96 5.66 7.44 6.05 L 4.95 5.05 C 4.73 4.96 4.46 5.05 4.34 5.27 L 2.34 8.73 C 2.21 8.95 2.27 9.22 2.46 9.37 L 4.57 11 C 4.53 11.34 4.5 11.67 4.5 12 C 4.5 12.33 4.53 12.65 4.57 12.97 L 2.46 14.63 C 2.27 14.78 2.21 15.05 2.34 15.27 L 4.34 18.73 C 4.46 18.95 4.73 19.03 4.95 18.95 L 7.44 17.94 C 7.96 18.34 8.5 18.68 9.13 18.93 L 9.5 21.58 C 9.54 21.82 9.75 22 10 22 H 14 C 14.25 22 14.46 21.82 14.5 21.58 L 14.87 18.93 C 15.5 18.67 16.04 18.34 16.56 17.94 L 19.05 18.95 C 19.27 19.03 19.54 18.95 19.66 18.73 L 21.66 15.27 C 21.78 15.05 21.73 14.78 21.54 14.63 L 19.43 12.97 Z'],
        },
        search: '',
        drawer: null,
        pageNum: 1,
        expanded: [],
        headers: [
          { title: 'Seal ID', key: 'id' },
          { title: 'CISI ID', key: 'cisi' },
          { title: 'Len', key: 'textlength' },
          { title: 'Inscription', key: 'canonized', align: 'end', cellProps: { class: 'indus' } },
          { title: 'Transliteration', key: 'description', align: ' d-none' },
          { title: 'Notes', key: 'notes', align: ' d-none' },
          { title: 'Sanskrit', key: 'sanskrit', cellProps: { class: 'sanskrit' } },
          { title: 'Translation', key: 'translation' },
          { title: '', key: 'data-table-expand' },
        ],
        items: inx,
        optionCanonical: false,
        optionBroken: false,
        lightTheme: false,
      }
    },
    computed: {
      activeFab () {
        return this.drawer ? { color: 'white', icon: this.icons.chevRight }
          : { color: 'green', icon: this.icons.chevLeft }
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
      chevLeft () { return this.icons.chevLeft },
      chevRight () { return this.icons.chevRight },
      isExpandedRow (id) {
        return this.expanded.indexOf(id) > -1
      },
      handleExpansion (item, state) {
        const itemIndex = this.expanded.indexOf(item.id)

        itemIndex > -1 ? this.expanded.splice(itemIndex, 1) : this.expanded.push(item.id)
      },
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
        return item.item.complete === 'Y' ? { class: 'primary--text' } : { class: 'text-red' }
      },
      pageChange (newPage) {
        localStorage.setItem('page', newPage)
        this.pageNum = newPage
      },
      persistCanonical (value) {
        localStorage.setItem('canonical', value)
      },
      persistBroken (value) {
        localStorage.setItem('broken', value)
      },
    },
    created () {
      this.pageNum = localStorage.getItem('page')
      this.optionCanonical = localStorage.getItem('canonical') === 'true'
      this.optionBroken = localStorage.getItem('broken') === 'true'
      this.lightTheme = localStorage.getItem('theme') == 'light'
    },
  }

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
        .indus {
            font-family: indus_scriptregular; font-size: 24pt;font-display: swap;
            white-space: pre;
        }
        .sanskrit {
            white-space: pre;
        }
        .v-text-field input {
            font-family: indus_scriptregular; font-size: 24pt;font-display: swap;
        }
</style>
