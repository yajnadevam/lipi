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
          <Schar value="अ"></Schar><Schar value="अयुग"></Schar><Ichar value="&#xE001;" />
        </v-list>
      </v-navigation-drawer>
      <v-main>
        <div class="d-flex justify-center align-center h-100">
  <v-data-table
    v-model:expanded="expanded"
    :headers="headers"
    :items="items"
    item-value="id"
    show-expand
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>Indus Valley Civilization Inscriptions</v-toolbar-title>
      </v-toolbar>
    </template>
    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <!-- <td :colspan="columns.length">
          More info about {{ item.description }}
        </td> -->
        <td></td><td>{{ item.xlit }}</td><td>{{ item.skt }}</td>
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
  import Ichar from '../components/ichar.vue'
  import Schar from '../components/schar.vue'
  import incx from '../assets/data/inscriptions.csv?raw'
  import xlits from '../assets/data/xlits.csv?raw'

  const inx = csv2json(incx, { keys: ['id', 'cisi', 'text'] })
  const xlitarray = csv2json(xlits)

  const xlitmap = {}
  xlitarray.forEach(element => {
    xlitmap[element.sign] = {}
    xlitmap[element.sign].xlit = element.xlit
    xlitmap[element.sign].canonical = element.canonical
    xlitmap[element.sign].regex = element.regex || element.xlit
  })

  xlitarray.forEach(element => {
    // xlitmap[element.sign].xlit = 
    mkregex(xlitmap[element.sign])
    // xlitmap[element.sign].xlit = 
  })

  inx.forEach(el => {
    el.xlit = xlitize(el.text)
    el.text = jsize(el.text)
  })

  export default {
    components: { Ichar, Schar },
    data () {
      return {
        drawer: null,
        expanded: [],
        headers: [
          { title: 'Seal ID', key: 'id' },
          { title: 'CISI ID', key: 'cisi' },
          { title: 'Inscription', key: 'text', cellProps: { class: 'indus' } },
          { title: 'Transliteration', key: 'description' },
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
    },
  }

  function jsize (text) {
    const re = /(\d+)/g
    const results = text.match(re)
    let str = ''
    results.forEach(row => {
      str += '\\u' + (0xE000 + parseInt(row)).toString(16)
    })
    return JSON.parse('"' + str + '"')
  }

  function mkregex (element) {
    if (element.sign == 235) {
      console.log(235)
    }
    if (!element.canonical || !(typeof (element.canonical) === 'string')) return element.xlit

    const list = element.canonical.split('-').reverse()
    let regex = ''; let lit = ''
    list.forEach(item => {
      if (xlitmap[item]) {
        lit += xlitmap[item].xlit
        regex += (xlitmap[item].regex || xlitmap[item].xlit)
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
    const results = text.match(re)
    if (xlitmap[results[0]] === undefined) {
      return console.log('No entry for', results[0])
    }
    let str = xlitmap[results[0]].xlit
    results.shift()
    results.forEach(row => {
      if (xlitmap[row]) {
        str += '-' + xlitmap[row].xlit
      } else {
        console.log('Missing row', row)
      }
    })
    return str
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
        }
</style>
