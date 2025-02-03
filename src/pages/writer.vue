<template>
  <div>
    <input v-model="devanagariInput" @input="updateDropdown" placeholder="Enter Devanagari text">
    <div v-if="dropdownVisible">
      <ul>
        <li v-for="unicode in filteredUnicodeList" :key="unicode" @click="selectUnicode(unicode)">
          {{ unicode }}
        </li>
      </ul>
    </div>
    <div>
      Output: {{ indusScriptOutput }}
    </div>
  </div>
</template>

<script>
import decipherCSV from '@/assets/data/decipher.csv';

export default {
  data() {
    return {
      devanagariInput: '',
      indusScriptOutput: '',
      decipherMap: {},
      unicodeList: [],
      filteredUnicodeList: [],
      dropdownVisible: false
    }
  },
  created() {
    this.parseCSV(decipherCSV);
    this.checkQueryParams();
  },
  methods: {
    parseCSV(csvText) {
      const lines = csvText.split("\n");
      lines.forEach(line => {
        const [devanagari, unicode] = line.split(',');
        this.decipherMap[devanagari] = unicode;
        this.unicodeList.push(unicode);
      });
    },
    updateDropdown() {
      const input = this.devanagariInput.slice(-1);
      this.filteredUnicodeList = this.unicodeList.filter(unicode => unicode.includes(input));
      this.dropdownVisible = this.filteredUnicodeList.length > 0;
    },
    selectUnicode(unicode) {
      this.indusScriptOutput += unicode;
      this.dropdownVisible = false;
    },
    checkQueryParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q');
      if (query) {
        this.devanagariInput = query;
        this.updateDropdown();
      }
    }
  }
}
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
  max-height: 150px;
  overflow-y: auto;
}

li {
  padding: 8px;
  cursor: pointer;
}

li:hover {
  background-color: #f0f0f0;
}
</style>