<template>
  <v-toolbar>
    <h1 class="indus" style="margin: 10px"></h1>
    <!-- </h1> -->
    <v-toolbar-title>Indus script corpus</v-toolbar-title>
    <v-spacer />
    <v-menu
      :close-on-content-click="false"
      :close-delay="2000"
      :open-on-hover="true"
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-icon :icon="icons.cog"></v-icon>
        </v-btn>
      </template>
      <v-list style="padding: 4px">
        <v-list-item-title>
          <v-switch
            v-model="optionCanonical"
            color="primary"
            label="Canonical"
            @update:model-value="persistCanonical"
          >
          </v-switch
        ></v-list-item-title>
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
            v-model="optionSandhi"
            color="primary"
            label="Sandhi"
            @update:model-value="persistSandhi"
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
  </v-toolbar>
  <HeaderLinks />

  <v-card>
    <v-layout>
      <v-main>
        <!-- Shared: Progress bar + Search -->
        <v-progress-linear height="2" :model-value="complete" color="green" />
        <div class="pa-2 search-container">
          <v-text-field
            id="search"
            v-model="search"
            clearable
            :clear-icon="icons.clear"
            @update:model-value="debouncedUpdateSearch"
            @click:clear="clearSearch"
            label="Search Indus valley inscriptions"
          />
        </div>

        <!-- DESKTOP: Data table -->
        <div v-if="!mobile">
          <v-data-table
            ref="target"
            v-model:expanded="expanded"
            :custom-filter="filterInscriptions"
            :first-icon="icons.pageFirst"
            :last-icon="icons.pageLast"
            :next-icon="icons.chevRight"
            :prev-icon="icons.chevLeft"
            :headers="computedHeaders"
            :sort-by="sortBy"
            item-value="id"
            :items="filtered"
            :page="pageNum"
            :row-props="itemrow"
            :search="search"
            show-expand
            @update:page="pageChange"
            @update:sort-by="sortChange"
            mobile-breakpoint="200"
          >
            <template v-slot:item.sanskrit="{ item }">
              <span v-if="item.cuneiform" class="cuneiform">{{
                item.sanskrit
              }}</span>
              <template v-else v-for="word in renderSanskrit(item.sanskrit)">
                <span
                  v-if="word.link == true"
                  class="sanskrit-link"
                  @click="showExplanation(word.word, item.id)"
                >
                  {{ word.word }}
                </span>
                <span
                  v-else-if="word.link == 'mw'"
                  class="sanskrit-link"
                  @click="showMwExplanation(word.word)"
                >
                  {{ word.word }}
                </span>
                <span v-else>
                  {{ word.word }}
                </span>
              </template>
            </template>

            <template v-slot:item.data-table-expand="{ item, isExpanded }">
              <v-icon
                v-if="isExpandedRow(item.id)"
                :icon="icons.collapse"
                @click="handleExpansion(item, isExpanded)"
              ></v-icon>
              <v-icon
                v-else
                :icon="icons.expand"
                @click="handleExpansion(item, isExpanded)"
              ></v-icon>
            </template>

            <template v-slot:expanded-row="{ columns, item }">
              <tr class="expanded-content">
                <td :colspan="columns.length" style="padding: 0 !important">
                  <!-- Info row -->
                  <div class="expanded-info-row">
                    <span v-if="item.site" class="expanded-site">{{ item.site }}</span>
                    <span class="sanskrit expanded-description">{{ item.description }}</span>
                    <span v-if="item.notes" class="expanded-notes">{{ item.notes }}</span>
                  </div>

                  <!-- Random -->
                  <div v-if="fullrandom" class="random" style="text-align: right; padding: 0 8px">
                    {{ item.random }}
                  </div>

                  <!-- Interlinear Gloss (Padapatha) -->
                  <div
                    v-if="(lemmasMap[item.lemmaRef || item.id] || []).length > 0"
                    class="interlinear-container"
                  >
                    <div
                      v-for="(lemma, idx) in lemmasMap[
                        item.lemmaRef || item.id
                      ]"
                      :key="idx"
                      class="interlinear-word"
                    >
                      <span class="interlinear-form-row">
                        <span class="interlinear-form sanskrit">{{
                          toDevanagari(lemma.form)
                        }}</span>
                        <v-icon v-if="lemma.analysis" class="verify-icon" size="12" @click="toggleReference(item.id + '-' + idx)">mdi-information-outline</v-icon>
                        <span v-if="vidyutResults[(item.lemmaRef || item.id) + '-' + idx]" :class="['vidyut-badge', 'vidyut-badge-clickable', vidyutResults[(item.lemmaRef || item.id) + '-' + idx].success ? 'vidyut-badge-success' : 'vidyut-badge-fail']" @click="toggleVidyutBadge(lemma, item.id, (item.lemmaRef || item.id), idx)">vidyut {{ vidyutResults[(item.lemmaRef || item.id) + '-' + idx].success ? '✓' : '✗' }}</span>
                      </span>
                      <span class="interlinear-analysis-row">
                        <span
                          class="interlinear-analysis"
                          :contenteditable="isDev && !item.lemmaRef"
                          @blur="
                            isDev &&
                            !item.lemmaRef &&
                            saveLemmaField(
                              item.id,
                              idx,
                              'analysis',
                              $event.target.textContent,
                            )
                          "
                          @keydown.enter.prevent="$event.target.blur()"
                          >{{ lemma.analysis }}</span
                        >
                        <span v-if="isDev && !item.lemmaRef" class="edit-icon"
                          >&#x270E;</span
                        >
                      </span>
                      <span class="interlinear-meaning-row">
                        <span
                          class="interlinear-meaning"
                          :contenteditable="isDev && !item.lemmaRef"
                          @blur="
                            isDev &&
                            !item.lemmaRef &&
                            saveLemmaField(
                              item.id,
                              idx,
                              'translation_lexeme',
                              $event.target.textContent,
                            )
                          "
                          @keydown.enter.prevent="$event.target.blur()"
                          >{{ lemma.translation_lexeme }}</span
                        >
                        <span v-if="isDev && !item.lemmaRef" class="edit-icon"
                          >&#x270E;</span
                        >
                      </span>
                      <div v-if="expandedRefs[item.id + '-' + idx]" class="lemma-reference">
                        {{ getLemmaReference(lemma) }}
                        <span v-if="getLemmaSutras(lemma).length" class="lemma-sutras">
                          <a v-for="s in getLemmaSutras(lemma)" :key="s" class="vidyut-rule-link" :href="'https://ashtadhyayi.com/sutraani/' + s" target="_blank">[{{ s }}]</a>
                        </span>
                      </div>
                      <div v-if="vidyutExpansions[item.id + '-' + idx]" class="vidyut-derivation">
                        <template v-for="(step, si) in vidyutExpansions[item.id + '-' + idx].steps" :key="si">
                          <div class="vidyut-step">
                            → {{ step.result.filter(r => r.text != '').map(r => toDevanagari(r.text.replaceAll('\\', '').replaceAll('^', ''))).join(' + ') }}
                            <a class="vidyut-rule-link" :href="'https://ashtadhyayi.com/sutraani/' + step.rule.code" target="_blank">[{{ step.rule.code }}]</a>
                          </div>
                        </template>
                        <div class="vidyut-step vidyut-result">
                          → {{ vidyutExpansions[item.id + '-' + idx].result }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Seal Images -->
                  <div
                    v-if="sealImages[item.cisi] && sealImages[item.cisi].length > 0"
                    class="text-center"
                  >
                    <v-row justify="center" class="ma-0">
                      <v-col
                        v-for="(img, index) in sealImages[item.cisi].slice(0, 2)"
                        :key="index"
                        :cols="6"
                        class="image-container"
                      >
                        <v-img
                          :src="`/seal_images/${img}`"
                          contain
                          class="hover-image"
                          :class="getSealClasses(item)"
                        />
                      </v-col>
                    </v-row>
                  </div>
                </td>
              </tr>
            </template>
          </v-data-table>
        </div>

        <!-- MOBILE: Sort chips + Card layout -->
        <div v-else class="mobile-view">
          <!-- Sort chips -->
          <div class="pa-2 d-flex align-center">
            <v-chip
              v-for="(option, oi) in mobileSortOptions"
              :key="option.key"
              size="small"
              variant="outlined"
              :color="
                sortBy.length && sortBy[0].key === option.key
                  ? 'primary'
                  : undefined
              "
              class="mr-2"
              @click="toggleMobileSort(option.key)"
            >
              {{ option.title }}
              <v-icon
                v-if="sortBy.length && sortBy[0].key === option.key"
                end
                :icon="
                  sortBy[0].order === 'asc' ? icons.arrowUp : icons.arrowDown
                "
                size="x-small"
              />
            </v-chip>
          </div>

          <!-- Cards -->
          <div class="mobile-cards">
            <div
              v-for="item in mobilePageItems"
              :key="item.id"
              class="mobile-card"
              :class="item.complete === 'Y' ? '' : 'text-red'"
            >
              <div class="mobile-panel-title">
                <div class="mobile-card-header">
                  <!-- Left: seal image carousel -->
                  <div class="mobile-card-left">
                    <div class="mobile-card-id-row">
                      <div v-if="sealImages[item.cisi] && sealImages[item.cisi].length > 1" class="carousel-nav-btn" @click.stop="carouselNav(item.cisi, -1)">
                        <v-icon color="white" size="14">mdi-chevron-left</v-icon>
                      </div>
                      <span class="mobile-card-id">{{ item.id }}</span>
                      <div v-if="sealImages[item.cisi] && sealImages[item.cisi].length > 1" class="carousel-nav-btn" @click.stop="carouselNav(item.cisi, 1)">
                        <v-icon color="white" size="14">mdi-chevron-right</v-icon>
                      </div>
                    </div>
                    <div
                      v-if="sealImages[item.cisi] && sealImages[item.cisi].length > 1"
                      class="carousel-wrapper"
                    >
                      <v-carousel
                        v-model="carouselIndex[item.cisi]"
                        class="mobile-seal-carousel"
                        height="100"
                        hide-delimiters
                        :show-arrows="false"
                        :touch="false"
                        @click.stop="openZoom(sealImages[item.cisi][carouselIndex[item.cisi] || 0], item)"
                      >
                        <v-carousel-item
                          v-for="(img, index) in sealImages[item.cisi]"
                          :key="index"
                        >
                          <v-img
                            :src="`/seal_images/${img}`"
                            contain
                            height="100"
                            class="mobile-seal-image"
                            :class="getSealClasses(item)"
                          />
                        </v-carousel-item>
                      </v-carousel>
                      <div class="mobile-carousel-counter">
                        {{ (carouselIndex[item.cisi] || 0) + 1 }}/{{
                          sealImages[item.cisi].length
                        }}
                      </div>
                    </div>
                    <div
                      v-else-if="
                        sealImages[item.cisi] &&
                        sealImages[item.cisi].length === 1
                      "
                      class="carousel-wrapper"
                      @click.stop="openZoom(sealImages[item.cisi][0], item)"
                    >
                      <v-img
                        :src="`/seal_images/${sealImages[item.cisi][0]}`"
                        contain
                        class="mobile-seal-image"
                        :class="getSealClasses(item)"
                      />
                    </div>
                    <div v-else class="mobile-no-image">
                      <v-icon color="grey" size="32">mdi-image-off</v-icon>
                    </div>
                  </div>
                  <!-- Right: inscription + transliterations -->
                  <div class="mobile-card-right">
                    <div class="indus mobile-indus-text">
                      {{ optionCanonical ? item.canonized : item.text }}
                    </div>
                    <div class="mobile-sanskrit-preview">
                      <span v-if="item.cuneiform" class="cuneiform">{{
                        item.sanskrit
                      }}</span>
                      <template
                        v-else
                        v-for="word in renderSanskrit(item.sanskrit)"
                      >
                        <span
                          v-if="word.link == true"
                          class="sanskrit-link"
                          @click.stop="showExplanation(word.word, item.id)"
                          >{{ word.word }}</span
                        >
                        <span v-else>{{ word.word }}</span>
                      </template>
                    </div>
                    <div
                      v-if="item.translation"
                      class="mobile-translation-preview"
                    >
                      {{ item.translation }}
                    </div>
                  </div>
                  <!-- Expand toggle -->
                  <div class="mobile-expand-btn" @click="toggleCard(item.id)">
                    <v-icon size="20">{{ expandedCards.has(item.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </div>
                </div>
              </div>

              <div v-if="expandedCards.has(item.id)" class="mobile-expanded-outer" @click="activeTooltip = null">
                <div class="mobile-expanded-wrapper">
                <div class="mobile-detail-row">
                  <span class="mobile-label">Seal ID:</span> {{ item.id }}
                  <span class="mobile-label ml-4">CISI:</span> {{ item.cisi }}
                  <span class="mobile-label ml-4">Site:</span> {{ item.site }}
                </div>
                <div class="mobile-detail-row sanskrit">
                  <span class="mobile-label">L{{ item.textlength }}:</span> {{ item.description }}
                </div>
                <div v-if="item.translation" class="mobile-detail-row">
                  <span class="mobile-label">Translation:</span> {{ item.translation }}
                </div>
                <div v-if="item.notes" class="mobile-detail-row">
                  <span class="mobile-label">Notes:</span> {{ item.notes }}
                </div>
                <!-- Interlinear Gloss -->
                <div
                  v-if="(lemmasMap[item.lemmaRef || item.id] || []).length > 0"
                  class="mobile-interlinear"
                >
                  <div class="interlinear-container">
                    <div
                      v-for="(lemma, idx) in lemmasMap[item.lemmaRef || item.id]"
                      :key="idx"
                      class="interlinear-word"
                    >
                      <span class="interlinear-form-row">
                        <span class="interlinear-form sanskrit">{{ toDevanagari(lemma.form) }}</span>
                        <v-icon v-if="lemma.analysis" class="verify-icon" size="12" @click.stop="toggleReference(item.id + '-' + idx)">mdi-information-outline</v-icon>
                        <span v-if="vidyutResults[(item.lemmaRef || item.id) + '-' + idx]" :class="['vidyut-badge', 'vidyut-badge-clickable', vidyutResults[(item.lemmaRef || item.id) + '-' + idx].success ? 'vidyut-badge-success' : 'vidyut-badge-fail']" @click.stop="toggleVidyutBadge(lemma, item.id, (item.lemmaRef || item.id), idx)">vidyut {{ vidyutResults[(item.lemmaRef || item.id) + '-' + idx].success ? '✓' : '✗' }}</span>
                      </span>
                      <span class="interlinear-analysis-row">
                        <span
                          class="interlinear-analysis"
                          :contenteditable="isDev && !item.lemmaRef"
                          @blur="isDev && !item.lemmaRef && saveLemmaField(item.id, idx, 'analysis', $event.target.textContent)"
                          @keydown.enter.prevent="$event.target.blur()"
                        >{{ lemma.analysis }}</span>
                        <span v-if="isDev && !item.lemmaRef" class="edit-icon">&#x270E;</span>
                      </span>
                      <span class="interlinear-meaning-row">
                        <span
                          class="interlinear-meaning"
                          :contenteditable="isDev && !item.lemmaRef"
                          @blur="isDev && !item.lemmaRef && saveLemmaField(item.id, idx, 'translation_lexeme', $event.target.textContent)"
                          @keydown.enter.prevent="$event.target.blur()"
                        >{{ lemma.translation_lexeme }}</span>
                        <span v-if="isDev && !item.lemmaRef" class="edit-icon">&#x270E;</span>
                      </span>
                      <div v-if="expandedRefs[item.id + '-' + idx]" class="lemma-reference">
                        {{ getLemmaReference(lemma) }}
                        <span v-if="getLemmaSutras(lemma).length" class="lemma-sutras">
                          <a v-for="s in getLemmaSutras(lemma)" :key="s" class="vidyut-rule-link" :href="'https://ashtadhyayi.com/sutraani/' + s" target="_blank">[{{ s }}]</a>
                        </span>
                      </div>
                        <div v-if="vidyutExpansions[item.id + '-' + idx]" class="vidyut-derivation">
                          <template v-for="(step, si) in vidyutExpansions[item.id + '-' + idx].steps" :key="si">
                            <div class="vidyut-step">
                              → {{ step.result.filter(r => r.text != '').map(r => toDevanagari(r.text.replaceAll('\\', '').replaceAll('^', ''))).join(' + ') }}
                              <a class="vidyut-rule-link" :href="'https://ashtadhyayi.com/sutraani/' + step.rule.code" target="_blank">[{{ step.rule.code }}]</a>
                            </div>
                          </template>
                          <div class="vidyut-step vidyut-result">
                            → {{ vidyutExpansions[item.id + '-' + idx].result }}
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile pagination -->
          <div class="d-flex justify-center mt-4 mb-4">
            <v-pagination
              v-model="pageNum"
              :length="mobileTotalPages"
              @update:model-value="pageChange"
              :total-visible="5"
              density="comfortable"
            />
          </div>
        </div>
      </v-main>
    </v-layout>
  </v-card>

  <v-dialog v-model="showExplanationDialog" max-width="600">
    <v-card>
      <v-card-title class="explanation-title">{{
        explanationDialogContent.devanagariWord
      }}</v-card-title>
      <v-card-text class="scrollable-card-text">
        <template v-if="explanationDialogContent.mwDialogContent">
          <div class="explanation-description">
            Monier-Williams Dictionary meaning for
            {{ explanationDialogContent.devanagariWord }}
          </div>

          <div
            class="mw-meaning"
            v-for="meaning in explanationDialogContent.mwDialogContent.content"
          >
            <span v-html="meaning"></span>
          </div>
          <v-divider></v-divider>
        </template>

        <template v-if="explanationDialogContent.prakriyaDialogContent">
          <span class="explanation-description"
            >Ashtadhyayi derivation of
            {{ explanationDialogContent.devanagariWord }}</span
          >
          <!-- <template
            v-for="prakriya in explanationDialogContent.prakriyaDialogContent"
          > -->
          <div class="prakriya-container">
            <!-- TODO: Needs to properly link to Ashtadhyayi website -->
            <!-- <span class="explanation-title"
                >{{ prakriya.title }} [{{ prakriya.code }}]
              </span>
              <a
                class="ashtadhyayi-link"
                :href="prakriya.ashtadhyayiLink"
                target="_blank"
                ><v-icon>mdi-open-in-new</v-icon></a
              > 

              <div class="prakriya-steps">
                {{ prakriya.dhatu }}
              </div> -->

            <template
              v-for="(step, index) in explanationDialogContent
                .prakriyaDialogContent.steps"
            >
              <div class="prakriya-steps">
                <v-icon>mdi-arrow-right</v-icon>
                {{
                  step.result
                    .filter((r) => r.text != "")
                    .map((r) =>
                      Sanscript.t(
                        r.text.replaceAll("\\", "").replaceAll("^", ""),
                        "slp1",
                        "devanagari",
                      ),
                    )
                    .join(" + ")
                }}
                <a
                  :href="'https://ashtadhyayi.com/sutraani/' + step.rule.code"
                  target="_blank"
                  >[{{ step.rule.code }}]</a
                >
              </div>
            </template>
            <div class="prakriya-steps">
              <v-icon>mdi-arrow-right</v-icon>
              {{ explanationDialogContent.prakriyaDialogContent.result }}
            </div>
            <!-- <div
              v-if="
                explanationDialogContent.prakriyaDialogContent.finalResult !=
                null
              "
              class="prakriya-steps"
            >
              <v-icon>mdi-arrow-right</v-icon>
              {{ explanationDialogContent.prakriyaDialogContent.finalResult }}
            </div> -->
          </div>
          <v-divider></v-divider>
          <!-- </template> -->
        </template>
      </v-card-text>
      <v-card-actions class="explanation-dialog-bottom">
        Credits:
        <a
          href="https://github.com/ambuda-org/vidyut"
          target="_blank"
          style="color: inherit"
          >Vidyut</a
        >
        <a
          href="https://github.com/ashtadhyayi-com/data"
          target="_blank"
          style="color: inherit"
          >Ashtadhyayi</a
        >
        <a
          href="https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/web/webtc/indexcaller.php"
          target="_blank"
          style="color: inherit"
          >MW</a
        >
        <v-spacer></v-spacer>
        <v-btn text @click="showExplanationDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showZoomDialog" max-width="90vw">
    <v-card class="zoom-dialog-card" @click="showZoomDialog = false">
      <v-img
        :src="zoomImageSrc ? `/seal_images/${zoomImageSrc}` : ''"
        contain
        max-height="80vh"
        :class="zoomImageClasses"
      />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { toRefs } from "vue";
import "@mdi/font/css/materialdesignicons.css";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { mdiOpenInNew } from "@mdi/js";
import sealImages from "@/assets/data/seal_id_and_image_mapping.json"; // Ensure the file is in `assets`
import { useTheme, useDisplay } from "vuetify";
const theme = useTheme();
const { mobile } = useDisplay();
theme.global.name.value = localStorage.getItem("theme") || "dark";

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  localStorage.setItem("theme", theme.global.name.value);
}
</script>
<script>
import { csv2json } from "json-2-csv";
import Key from "../components/Key.vue";
import HeaderLinks from "../components/HeaderLinks.vue";
import incx from "../assets/data/inscriptions.csv?raw";
import xlits from "../assets/data/xlits.csv?raw";
import prakriyaMap from "../assets/data/prakriyas.json";
import lemmasCsv from "../../glossing.csv?raw";
import mwMap from "../assets/data/mw.json";
import lexicons from "../assets/data/lexicons.json";
import dhatuMap from "../assets/data/dhatu.json";
import dhatupatha from "../assets/vidyut/vidyut_dhatupatha_5.tsv";
import initVidyut, { Vidyut } from "../vidyut/vidyut_prakriya.js";
import initSandhi, { Sandhi } from "../vidyut/vidyut_sandhi.js";
import words from "../assets/data/words.csv?raw";
import { filter } from "@/scripts/index/filter";
import { renderSanskrit } from "@/scripts/index/explanation";
import { buildDhatuIndex, derive } from '@/scripts/vidyut-derive'
// eslint-disable-next-line import/first
import Sanscript from "@indic-transliteration/sanscript";

const lexiconSources = new Set()
for (const entries of Object.values(lexicons)) {
  for (const entry of entries) lexiconSources.add(entry.source)
}

// Will be initialized after mount
let vidyut
let dhatuIdx
let sandhiEngine

// Todo: This can be removed
const wordsMap = {};
csv2json(words).forEach((value) => {
  const { word, seal_id, ...rest } = value;
  if (word) {
    if (!wordsMap[word]) {
      wordsMap[word] = {};
    }

    wordsMap[word][seal_id] = {
      word,
      ...rest,
    };
  }
});

// Lemma per inscription lookup map (id -> array of lemmas)
const lemmasMap = {};
// Convert CRLF to LF - json-2-csv doesn't handle CRLF properly
csv2json(lemmasCsv.replace(/\r\n/g, "\n")).forEach((row) => {
  const id = row.id;
  if (id) {
    if (!lemmasMap[id]) {
      lemmasMap[id] = [];
    }
    lemmasMap[id].push(row);
  }
});

const inx = csv2json(incx, {
  keys: [
    "id",
    "cisi",
    "site",
    "material",
    "color",
    "complete",
    "text",
    "text length",
    "sanskrit",
    "translation",
    "notes",
    "symbol",
    "type",
    "phase",
    "period",
  ],
});
const iso = Sanscript.t(
  "aAiIuUoOfFxXEOMHkKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL",
  "slp1",
  "iast",
);
const slp = "aiukgcjtdnpbmyrlvsmst";
const xlitarray = csv2json(xlits);
const fullrandom = false;

let totalLen = 0;
let totalCount = 0;
let decipheredLen = 0;
let decipheredCount = 0;

const canonMap = {};
const xlitmap = {};
const inxMap = {};

xlitarray.forEach((element) => {
  xlitmap[element.sign] = {};
  xlitmap[element.sign].xlit = element.xlit;
  xlitmap[element.sign].canonical = element.canonical;
  xlitmap[element.sign].random = mkrandom(fullrandom ? slp : slp);
  xlitmap[element.sign].regex = element.regex || element.xlit;
  canonMap[characterize(element.sign)] = characterize(element.canonical);
});

xlitarray.forEach((element) => {
  mkregex(xlitmap[element.sign]);
});

const SLASH_SEP = String.fromCharCode(0xe3e7).repeat(4);

inx.forEach((el) => {
  const analyzed = xlitize(el.text);
  el.description = analyzed.description;
  el.random = analyzed.random;
  el.regex = analyzed.regex;
  const canonized = canonize(el.text);
  el.text = canonized.str; // jsize(el.text)
  if (el.text.includes(SLASH_SEP)) {
    el.text = el.text.split(SLASH_SEP).reverse().join("\n");
  }
  el.textlength = parseInt(el["text length"]);
  el.canonized = canonized.canon;
  if (el.canonized.includes(SLASH_SEP)) {
    el.canonized = el.canonized.split(SLASH_SEP).reverse().join("\n");
  }
  // Store original SLP1 for sandhi toggle
  el.sanskritSlp1 = el.sanskrit || null;
  el.sanskrit = el.sanskrit ? el.sanskrit.replaceAll("-", "—") : el.sanskrit;
  totalLen += el.complete === "Y" ? el.textlength : 0;
  totalCount += el.complete === "Y" ? 1 : 0;
  decipheredLen += el.complete === "Y" && el.sanskrit ? el.textlength : 0;
  // if (el.translation) console.log(el.translation)
  decipheredCount += el.translation ? 1 : 0;
  //  if(el.complete === 'N' && el.sanskrit) console.log(">>", el.id, "L", el.textlength, 'C:', el.complete, 'X:', el.translation, 'D:', decipheredLen, 'T:', totalLen)
  if (el.translation && /[\u{12000}-\u{1236E}]/u.test(el.translation)) {
    // Cuneiform entry: parse translation to extract script + transliteration
    const cuneMatch = el.translation.match(
      /^([\u{12000}-\u{1254F}\s\u2082]+)\s*\[([^:]+):\s*'([^']+)',?\s*(.+)\]/u,
    );
    if (cuneMatch) {
      el.cuneiform = true;
      el.sanskrit = cuneMatch[1].trim() + "\n" + cuneMatch[3];
      el.translation = cuneMatch[4].replace(/\]\s*$/, "").trim();
      el.sanskritSlp1 = null; // Not SLP1 — cuneiform
    } else {
      el.sanskrit = "*" + analyzed.str.split("-").reverse().join("");
      el.sanskritSlp1 = null;
    }
  } else if (el.sanskrit && el.sanskrit.trim()) {
    if (el.sanskritSlp1 && el.sanskritSlp1.startsWith("ref:")) {
      el.lemmaRef = el.sanskrit.substring(4);
      el.sanskritSlp1 = null; // Resolved in applySandhi via lemmaRef
      Object.assign(el, resolve(el.sanskrit));
    } else {
      // console.log(">>", Sanscript.t(el.sanskrit, "slp1", "iast"));
      el.sanskrit =
        Sanscript.t(el.sanskrit, "slp1", "devanagari") +
        "\n" +
        Sanscript.t(el.sanskrit, "slp1", "iast");
    }
  } else {
    el.sanskrit = "*" + analyzed.str.split("-").reverse().join(""); // el.description.replaceAll('-', '')
    el.sanskritSlp1 = null;
  }
  // if(el.sanskrit) {
  //   el.sanskrit = el.sanskrit.split(/—|\s/).map((key) => {
  //   if(key=='अकक') {
  //     console.log(key, urlMap[key])
  //     return urlMap[key] ? '<a href="' + urlMap[key] + '">' + key + '</a>' : key
  //     // return key
  //   }
  //   }).join('—')
  // }
  inxMap[el.id] = el;
});

function mkrandom(alphabet) {
  const randomInd = Math.floor(Math.random() * alphabet.length);
  return alphabet.charAt(randomInd);
}

function resolve(ref) {
  const referred = inxMap[ref.substring(4)];
  if (!referred) return console.log("Failed to find reference", ref);
  return { sanskrit: referred.sanskrit, translation: referred.translation };
}

function canonized(text) {
  let canonizedStr = "";
  for (let i = 0; i < parseInt(text.length); i++) {
    canonizedStr += canonMap[text.charAt(i)];
  }
  return canonizedStr;
}

function characterize(points) {
  const charset = points.toString().split("-");
  let result = "";
  charset.forEach((point) => {
    result += "\\u" + (0xe000 + parseInt(point)).toString(16);
  });
  return JSON.parse('"' + result + '"');
}

function canonize(text) {
  text = text.replaceAll("/", "-999-999-999-999-");
  const re = /(\d+)/g;
  const results = text.match(re);
  let str = "";
  let canon = "";
  results.forEach((row) => {
    const thisChar = "\\u" + (0xe000 + parseInt(row)).toString(16);
    str += thisChar;
    if (row !== xlitmap[row].canonical) {
      if (!xlitmap[row].canonical) return row;
      const canel = xlitmap[row].canonical.toString().split("-");
      canon += canel
        .map((a) => {
          return "\\u" + (0xe000 + parseInt(a)).toString(16);
        })
        .join("");
    } else {
      canon += thisChar;
    }
  });
  str = JSON.parse('"' + str + '"');
  canon = JSON.parse('"' + canon + '"');
  return { str, canon };
}

function mkregex(element) {
  if (!element.canonical || !(typeof element.canonical === "string")) {
    if (!xlitmap[element.canonical]) {
      return console.log("No xlit for", element, element.canonical);
    }
    element.xlit = xlitmap[element.canonical].xlit;
    element.regex = element.xlit;
    return;
  }

  const list = element.canonical.split("-").reverse();
  let regex = "";
  let lit = "";
  list.forEach((item) => {
    const sign = xlitmap[item];
    if (sign) {
      lit += sign.xlit;
      regex += sign.regex || sign.xlit;
    } else {
      console.log("no xlit for", item);
    }
  });
  element.xlit = element.xlit || lit;
  element.regex = element.regex || regex;
  return regex;
}

function xlitize(text) {
  const re = /(\d+)/g;
  const results = text.match(re).reverse();
  if (xlitmap[results[0]] === undefined) {
    return console.log("Warning: Missing sign", results[0]);
  }
  let str = xlitmap[results[0]].xlit;
  let rnd = xlitmap[results[0]].random;
  let regex = str;
  results.shift();
  results.forEach((row) => {
    const sign = xlitmap[row];
    if (sign) {
      if (
        str.match(/^.*([iu]|an|as)$/) == null &&
        sign.xlit.match(/^[aiu]$/) == null &&
        !str.endsWith(".")
      ) {
        str += "a";
        regex += "a?";
      }
      if (
        !fullrandom &&
        rnd.match(/^.*([iueofFxX]|an|as)$/) == null &&
        sign.random.match(/^[aiu]$/) == null &&
        !str.endsWith(".")
      ) {
        rnd += "a";
      }
      str += "-" + sign.xlit;
      rnd += "-" + sign.random;
      regex += sign.xlit;
    } else {
      console.log("Warning: Missing sign", row);
    }
  });
  if (str.match(/.*([iu]|an|as)$/) === null) {
    str += "a";
    regex += "a?";
  }
  if (!fullrandom && rnd.match(/.*([iueo]|an|as)$/) === null) {
    rnd += "a";
  }
  str = str.split("-").reverse().join("-");
  rnd = rnd.split("-").reverse().join("-");
  const description = str.split("-").join("-");
  const random = "⚄ random: " + rnd;
  return { str, regex, description, random };
}

export default {
  components: { Key, HeaderLinks },
  data() {
    return {
      icons: {
        defaultSet: "mdi",
        aliases: {
          ...aliases,
          openInNew: mdiOpenInNew,
        },
        sets: {
          mdi,
        },
        pageFirst: [
          "M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z",
        ],
        pageLast: [
          "M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z",
        ],
        chevLeft: [
          "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
        ],
        chevRight: [
          "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
        ],
        expand: ["M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"],
        collapse: [
          "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
        ],
        arrowUp: [
          "M4,12L5.41,13.41L11,7.83V20H13V7.83L18.58,13.42L20,12L12,4L4,12Z",
        ],
        arrowDown: [
          "M20,12L18.59,10.59L13,16.17V4H11V16.17L5.42,10.58L4,12L12,20L20,12Z",
        ],
        cog: [
          "M 12 15.5 A 3.5 3.5 0 0 1 8.5 12 A 3.5 3.5 0 0 1 12 8.5 A 3.5 3.5 0 0 1 15.5 12 A 3.5 3.5 0 0 1 12 15.5 M 19.43 12.97 C 19.47 12.65 19.5 12.33 19.5 12 C 19.5 11.67 19.47 11.34 19.43 11 L 21.54 9.37 C 21.73 9.22 21.78 8.95 21.66 8.73 L 19.66 5.27 C 19.54 5.05 19.27 4.96 19.05 5.05 L 16.56 6.05 C 16.04 5.66 15.5 5.32 14.87 5.07 L 14.5 2.42 C 14.46 2.18 14.25 2 14 2 H 10 C 9.75 2 9.54 2.18 9.5 2.42 L 9.13 5.07 C 8.5 5.32 7.96 5.66 7.44 6.05 L 4.95 5.05 C 4.73 4.96 4.46 5.05 4.34 5.27 L 2.34 8.73 C 2.21 8.95 2.27 9.22 2.46 9.37 L 4.57 11 C 4.53 11.34 4.5 11.67 4.5 12 C 4.5 12.33 4.53 12.65 4.57 12.97 L 2.46 14.63 C 2.27 14.78 2.21 15.05 2.34 15.27 L 4.34 18.73 C 4.46 18.95 4.73 19.03 4.95 18.95 L 7.44 17.94 C 7.96 18.34 8.5 18.68 9.13 18.93 L 9.5 21.58 C 9.54 21.82 9.75 22 10 22 H 14 C 14.25 22 14.46 21.82 14.5 21.58 L 14.87 18.93 C 15.5 18.67 16.04 18.34 16.56 17.94 L 19.05 18.95 C 19.27 19.03 19.54 18.95 19.66 18.73 L 21.66 15.27 C 21.78 15.05 21.73 14.78 21.54 14.63 L 19.43 12.97 Z",
        ],
        clear: [
          "M 8.00386 9.41816 C 7.61333 9.02763 7.61334 8.39447 8.00386 8.00395 C 8.39438 7.61342 9.02755 7.61342 9.41807 8.00395 L 12.0057 10.5916 L 14.5907 8.00657 C 14.9813 7.61605 15.6144 7.61605 16.0049 8.00657 C 16.3955 8.3971 16.3955 9.03026 16.0049 9.42079 L 13.4199 12.0058 L 16.0039 14.5897 C 16.3944 14.9803 16.3944 15.6134 16.0039 16.0039 C 15.6133 16.3945 14.9802 16.3945 14.5896 16.0039 L 12.0057 13.42 L 9.42097 16.0048 C 9.03045 16.3953 8.39728 16.3953 8.00676 16.0048 C 7.61624 15.6142 7.61624 14.9811 8.00676 14.5905 L 10.5915 12.0058 L 8.00386 9.41816 Z",
        ],
      },
      sortBy: [{ key: "textlength", order: "desc" }],
      search: "",
      drawer: null,
      pageNum: 1,
      oldPageNum: null,
      expanded: [],
      headers: [
        { title: "Seal ID", key: "id", width: "70px" },
        { title: "CISI ID", key: "cisi", width: "100px" },
        { title: "Len", key: "textlength", width: "40px" },
        {
          title: "Inscription(R to L)",
          key: "text",
          align: "center",
          cellProps: { class: "indus" },
          headerProps: { class: 'indus-header' },
          width: 'calc((100% - 250px) / 3)',
        },
        { title: "Transliteration", key: "description", align: " d-none" },
        { title: "Notes", key: "notes", align: " d-none" },
        {
          title: "Sanskrit(L to R)",
          key: "sanskrit",
          align: "center",
          cellProps: { class: "sanskrit" },
          headerProps: { class: 'sanskrit-header' },
          width: 'calc((100% - 250px) / 3)',
        },
        { title: "Translation", key: "translation", width: 'calc((100% - 250px) / 3)' },
        { title: "", key: "data-table-expand", width: "40px" },
      ],
      items: inx,
      optionCanonical: false,
      optionBroken: false,
      optionSandhi: false,
      lightTheme: false,
      fullrandom: fullrandom,
      showExplanationDialog: false,
      explanationDialogContent: {},
      lemmasMap,
      isDev: import.meta.env.DEV,
      carouselIndex: {},
      showZoomDialog: false,
      zoomImageSrc: null,
      zoomImageClasses: "",
      activeTooltip: null,
      mobileSortOptions: [
        { title: "Length", key: "textlength" },
        { title: "Seal ID", key: "id" },
        { title: "CISI", key: "cisi" },
        { title: "Sanskrit", key: "sanskrit" },
      ],
      expandedCards: new Set(),
      vidyutExpansions: {},
      vidyutResults: {},
      expandedRefs: {},
    };
  },
  computed: {
    complete() {
      console.log("C", decipheredLen, "/", totalLen);
      return (100 * decipheredLen) / totalLen;
    },
    completeCount() {
      console.log("N", decipheredCount, "/", totalCount);
      return (100 * decipheredCount) / totalCount;
    },
    activeFab() {
      return this.drawer
        ? { color: "white", icon: this.icons.chevRight }
        : { color: "green", icon: this.icons.chevLeft };
    },
    filtered() {
      return this.items.filter((e) => this.optionBroken || e.complete === "Y");
    },
    computedHeaders() {
      this.headers.forEach((h) => {
        if (h.title === "Inscription(R to L)") {
          h.key = this.optionCanonical ? "canonized" : "text";
        }
      });
      return this.headers;
    },
    filteredAndSearched() {
      if (!this.search) return this.filtered;
      return this.filtered.filter((item) => {
        const columns = {};
        this.headers.forEach((h) => {
          if (h.key) columns[h.key] = item[h.key] || "";
        });
        const wrapped = { raw: item, columns };
        return filter(null, this.search, wrapped, this.optionBroken);
      });
    },
    sortedMobileItems() {
      const items = [...this.filteredAndSearched];
      if (this.sortBy.length === 0) return items;
      const { key, order } = this.sortBy[0];
      items.sort((a, b) => {
        const va = a[key],
          vb = b[key];
        if (typeof va === "number" && typeof vb === "number") {
          return order === "asc" ? va - vb : vb - va;
        }
        const sa = (va || "").toString(),
          sb = (vb || "").toString();
        return order === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
      return items;
    },
    mobilePageItems() {
      const perPage = 10;
      const start = (this.pageNum - 1) * perPage;
      return this.sortedMobileItems.slice(start, start + perPage);
    },
    mobileTotalPages() {
      return Math.ceil(this.sortedMobileItems.length / 10);
    },
  },

  methods: {
    openZoom(imgFile, item) {
      this.zoomImageSrc = imgFile;
      this.zoomImageClasses = this.getSealClasses(item);
      this.showZoomDialog = true;
    },
    carouselNav(cisi, dir) {
      const len = sealImages[cisi] ? sealImages[cisi].length : 0;
      if (!len) return;
      const cur = this.carouselIndex[cisi] || 0;
      this.carouselIndex[cisi] = (cur + dir + len) % len;
    },
    toggleTooltip(key) {
      this.activeTooltip = this.activeTooltip === key ? null : key;
    },
    toggleCard (id) {
      if (this.expandedCards.has(id)) {
        this.expandedCards.delete(id)
      } else {
        this.expandedCards.add(id)
      }
      this.expandedCards = new Set(this.expandedCards)
    },
    toggleMobileSort (key) {
      if (this.sortBy.length && this.sortBy[0].key === key) {
        this.sortBy = [
          { key, order: this.sortBy[0].order === "asc" ? "desc" : "asc" },
        ];
      } else {
        this.sortBy = [{ key, order: "desc" }];
      }
      this.pageNum = 1
    },
    cleanMwEntry(text) {
      return text
        .split("\n")[0]
        .replace(/<[^>]*>/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/&c\.\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();
    },
    getMwLex(mwKey) {
      const entries = mwMap[mwKey];
      if (!entries) return "";
      for (const e of entries) {
        const m = e.match(/<lex>([^<]+)<\/lex>/);
        if (m) return m[1];
      }
      return "";
    },
    cleanMwWithLex(mwKey, raw) {
      const cleaned = this.cleanMwEntry(raw);
      if (/<lex>/.test(raw)) return cleaned;
      const lex = this.getMwLex(mwKey);
      if (!lex) return cleaned;
      // Insert lex after Devanagari headword if present, otherwise prepend
      if (/^[\u0900-\u097F]/.test(cleaned)) {
        return cleaned.replace(
          /^([\u0900-\u097F\u0901-\u0963\u0966-\u096F\u200D]+)\s*/,
          "$1 " + lex + " ",
        );
      }
      return lex + " " + cleaned;
    },
    findMwLineById(mwKey, id) {
      const entries = mwMap[mwKey];
      if (!entries || !entries.length) return null;
      if (id) {
        const match = entries.find((e) => e.includes("[ID=" + id + "]"));
        if (match) return this.cleanMwWithLex(mwKey, match);
      }
      return null;
    },
    findMwLineByText(mwKey, target) {
      const entries = mwMap[mwKey];
      if (!entries || !entries.length) return null;
      if (target) {
        const lc = target.toLowerCase();
        const match = entries.find((e) => e.toLowerCase().includes(lc));
        if (match) return this.cleanMwWithLex(mwKey, match);
        const stem = lc.replace(
          /(er|or|ing|ed|tion|ness|ment|ous|ive|able|ful)$/,
          "",
        );
        if (stem !== lc) {
          const stemMatch = entries.find((e) => e.toLowerCase().includes(stem));
          if (stemMatch) return this.cleanMwWithLex(mwKey, stemMatch);
        }
      }
      return this.cleanMwWithLex(mwKey, entries[0]);
    },
    withDevanagari(slp1Key, text) {
      if (!text || /^[\u0900-\u097F]/.test(text)) return text;
      return this.toDevanagari(slp1Key) + " " + text;
    },
    getLemmaSutras (lemma) {
      if (!lemma.analysis) return []
      return lemma.analysis
        .split(/\s+/)
        .filter(p => p.startsWith('SUTRA.'))
        .map(p => p.slice(6))
    },
    getLemmaReference (lemma) {
      if (!lemma.analysis) return '--'
      const target = lemma.translation_lexeme
      // External lexicon lookup. The analysis prefix doubles as the source tag
      // (e.g. `Apte.raRaka`), and we dispatch only for sources we actually have
      // entries for in lexicons.json.
      const dictPrefixMatch = lemma.analysis.match(/^([A-Z][A-Za-z]+)\./)
      if (dictPrefixMatch && lexiconSources.has(dictPrefixMatch[1])) {
        const source = dictPrefixMatch[1]
        const parts = lemma.analysis.split('.')
        const key = parts[1]
        const lookupKey = key.includes('-') ? key.split('-').pop() : key
        const entries = (lexicons[lookupKey] || []).filter(e => e.source === source)
        if (entries.length) {
          return this.withDevanagari(key, entries.map(e => e.gloss).join('; '))
        }
        return '--'
      }
      if (lemma.analysis.startsWith('MW.') || lemma.analysis.startsWith('INDC.')) {
        // ID may be integer or decimal sub-ID (e.g. 22015.20) referencing a
        // CDSL <H1A> continuation entry; split on the first space to keep the
        // decimal intact.
        const head = lemma.analysis.split(' ')[0]
        const parts = head.split('.')
        const mwKey = parts[1]
        const mwId = parts.length > 2 ? parts.slice(2).join('.') : null
        // If key has prefix (e.g. A-dA), look up the root (dA) in MW
        const lookupKey = mwKey.includes('-') ? mwKey.split('-').pop() : mwKey
        const ref = this.findMwLineById(lookupKey, mwId) ||
          this.findMwLineByText(lookupKey, target)
        return ref ? this.withDevanagari(mwKey, ref) : '--'
      }
      if (lemma.analysis.startsWith("DHATU.")) {
        const dhatuRaw = lemma.analysis.split(".")[1];
        const dhatuClean = dhatuRaw.includes("~")
          ? dhatuRaw.replace(/[aiufFeEoO]?[~^\\]+/g, "")
          : dhatuRaw;
        // If the DHATU analysis also carries an explicit MW reference, prefer
        // that MW entry over the dhātupāṭha gloss — the user-supplied ID is
        // the authoritative lookup. Two forms are accepted:
        //   MW.stem.id   — fully qualified (e.g., `MW.jana.76735`)
        //   MW.id        — bare ID, implicitly tied to the DHATU stem
        //                  (e.g., `MW.104757` paired with `DHATU.naSa~.Bhvadi`)
        const mwRefFull = lemma.analysis.match(/\bMW\.([a-zA-Z~^\\][^.\s]*)(?:\.(\d+(?:\.\d+)?))?/);
        if (mwRefFull) {
          const mwKey = mwRefFull[1];
          const mwId = mwRefFull[2];
          const lookupKey = mwKey.includes("-") ? mwKey.split("-").pop() : mwKey;
          const ref = this.findMwLineById(lookupKey, mwId) ||
            this.findMwLineByText(lookupKey, target);
          if (ref) return this.withDevanagari(mwKey, ref);
        }
        const mwRefBareId = lemma.analysis.match(/\bMW\.(\d+)\b/);
        if (mwRefBareId) {
          const id = mwRefBareId[1];
          // Scan mwMap for the entry with this ID; use its stem key for rendering.
          for (const [stem, entries] of Object.entries(mwMap)) {
            const match = entries.find(e => e.includes("[ID=" + id + "]"));
            if (match) {
              return this.withDevanagari(stem, this.cleanMwWithLex(stem, match));
            }
          }
        }
        // Look up in dhatu dictionary (keyed by dhatupatha form)
        const dhatuEntries =
          dhatuMap[dhatuRaw] ||
          (dhatuRaw.includes("-") && dhatuMap[dhatuRaw.split("-").pop()]);
        if (dhatuEntries)
          return (
            "\u221A" + this.toDevanagari(dhatuClean) + " " + dhatuEntries[0]
          );
        // Fallback: try clean form in MW
        const dhatuKey = dhatuRaw.replace(/[~^]/g, "");
        const result =
          this.findMwLineByText(dhatuKey, target) ||
          (dhatuKey.includes("-") &&
            this.findMwLineByText(dhatuKey.split("-").pop(), target));
        return result
          ? "\u221A" + this.toDevanagari(dhatuClean) + " " + result
          : "--";
      }
      return "--";
    },
    toggleVidyutBadge (lemma, itemId, sourceId, idx) {
      const key = itemId + '-' + idx
      if (this.vidyutExpansions[key]) {
        this.vidyutExpansions[key] = null
      } else {
        this.vidyutExpansions[key] = this.vidyutResults[sourceId + '-' + idx]
      }
    },
    toggleReference (key) {
      this.expandedRefs[key] = !this.expandedRefs[key]
    },
    precomputeVidyutResults () {
      const results = {}
      const derivablePattern = /\bDHATU\.|\b(Nom|Acc|Ins|Dat|Abl|Gen|Loc|Voc)\.[MFN]\.[SDP]\b/
      for (const [id, lemmas] of Object.entries(this.lemmasMap)) {
        for (let idx = 0; idx < lemmas.length; idx++) {
          const lemma = lemmas[idx]
          if (!lemma.analysis) continue
          const isDerivable = derivablePattern.test(lemma.analysis)
          const isStemProbe = !isDerivable && lemma.type === 'stem' && /\bMW\.|\bPRON\.|\bApte\./.test(lemma.analysis)
          if (!isDerivable && !isStemProbe) continue
          const key = id + '-' + idx
          let dr = null
          try {
            dr = derive(vidyut, lemma.analysis, lemma.form, { dhatuIndex: dhatuIdx, wordsMap, itemId: id, type: lemma.type })
          } catch (e) {
            console.warn(`vidyut derivation failed for ${id}/${lemma.form}:`, e.message || e)
          }
          if (dr) {
            results[key] = {
              steps: dr.steps,
              result: Sanscript.t(dr.text, 'slp1', 'devanagari'),
              success: dr.match,
            }
          } else if (!isStemProbe) {
            results[key] = { steps: [], result: '(unable to derive)', success: false }
          }
        }
      }
      // Single reactive assignment instead of per-entry updates
      this.vidyutResults = results
      const failures = Object.entries(results)
        .filter(([, r]) => !r.success)
        .map(([key, r]) => {
          const [id] = key.split('-')
          const idx = parseInt(key.split('-').pop())
          const lemma = this.lemmasMap[id]?.[idx]
          return `${id} ${lemma?.form}: expected ${this.toDevanagari(lemma?.form)} got ${r.result} | ${lemma?.analysis}`
        })
      console.log(`vidyut: ${Object.keys(results).length} total, ${Object.keys(results).length - failures.length} pass, ${failures.length} fail`)
      if (failures.length) console.table(failures)
    },
    // deriveFromAnalysis and _deriveCore removed — now in shared module @/scripts/vidyut-derive
    saveLemmaField (id, idx, field, value) {
      // eslint-disable-next-line no-misleading-character-class
      const cleaned = value
        .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, "")
        .trim();
      console.log("saveLemmaField", { id, idx, field, value: cleaned });
      fetch("/api/update-lemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, idx, field, value: cleaned }),
      })
        .then((r) => r.json())
        .then((data) => console.log("saveLemmaField result:", data))
        .catch((err) => console.error("saveLemmaField error:", err));
    },
    toDevanagari(slp1Text) {
      if (!slp1Text) return "";
      return Sanscript.t(slp1Text, "slp1", "devanagari");
    },
    chevLeft() {
      return this.icons.chevLeft;
    },
    chevRight() {
      return this.icons.chevRight;
    },
    isExpandedRow(id) {
      return this.expanded.indexOf(id) > -1;
    },
    handleExpansion(item, state) {
      const itemIndex = this.expanded.indexOf(item.id);

      itemIndex > -1
        ? this.expanded.splice(itemIndex, 1)
        : this.expanded.push(item.id);
    },
    filterInscriptions(value, query, item) {
      return filter(value, query, item, this.optionBroken);
    },
    itemrow(item) {
      return item.item.complete === "Y"
        ? { class: "primary--text" }
        : { class: "text-red" };
    },
    pageChange(newPage) {
      const isSearching = this.search !== null && this.search !== "";
      localStorage.setItem("page", newPage);
      this.pageNum = newPage;
      this.oldPageNum = null;
    },
    sortChange(newSort) {
      localStorage.setItem("sort", JSON.stringify(newSort));
      this.sortBy = newSort;
      this.pageNum = 1;
    },
    persistCanonical(value) {
      localStorage.setItem("canonical", value);
    },
    persistBroken(value) {
      localStorage.setItem("broken", value);
    },
    persistSandhi(value) {
      localStorage.setItem("sandhi", value);
      this.applySandhi();
    },
    applySandhi() {
      for (const el of this.items) {
        if (el.sanskritSlp1) {
          if (this.optionSandhi && sandhiEngine) {
            const words = el.sanskritSlp1.split('-');
            let joined = words[0] || '';
            for (let i = 1; i < words.length; i++) {
              joined = sandhiEngine.join(joined, words[i]);
            }
            el.sanskrit =
              Sanscript.t(joined, 'slp1', 'devanagari') +
              '\n' +
              Sanscript.t(joined, 'slp1', 'iast');
          } else {
            const slp1 = el.sanskritSlp1.replaceAll('-', '—');
            el.sanskrit =
              Sanscript.t(slp1, 'slp1', 'devanagari') +
              '\n' +
              Sanscript.t(slp1, 'slp1', 'iast');
          }
        }
      }
      // Second pass: update ref entries from their targets
      for (const el of this.items) {
        if (el.lemmaRef) {
          const referred = inxMap[el.lemmaRef];
          if (referred) el.sanskrit = referred.sanskrit;
        }
      }
    },
    updateUrl(searchTerm) {
      const params = new URLSearchParams(window.location.search);
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }

      const newUrl = searchTerm
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      history.replaceState({}, "", newUrl);
    },
    updateSearch(value) {
      if (value !== "" && value !== null) {
        this.oldPageNum = this.oldPageNum || this.pageNum;
        this.pageNum = 1
        localStorage.setItem("search", this.search);
      } else {
        this.clearSearch();
      }
      this.updateUrl(value);
    },
    clearSearch() {
      if ((this.search === null || this.search === "") && this.oldPageNum) {
        this.pageNum = this.oldPageNum;
      }
      localStorage.removeItem("search");
    },
    pasteSearch() {
      const selection = window.getSelection().toString();
      if (selection === null || selection === "") return;
      this.search = selection.trim() + (this.search || "");
      localStorage.setItem("search", this.search);
    },
    getSealClasses(item) {
      let material = item.material
        ? item.material.toLowerCase().replace(/\s+/g, "")
        : "";
      let color = item.color
        ? item.color.toLowerCase().replace(/[\s\-]+/g, "")
        : "";

      return `seal-mat-${material} seal-mat-${material}-${color}`;
    },
    // Todo: Maybe refactor better ?
    // This function determines if words in the Sanskrit transliteration need to be linked because they have prakriya or MW definitions
    renderSanskrit: renderSanskrit,
    getKrdantaAshtadhyayiLink(code, index, pratyaya) {
      return `https://ashtadhyayi.com/dhatu/${code}?tab=krut&scroll=dhatuform-${index}-krut-${pratyaya}&scrollcolor=cyan&scrolloffset=400`;
    },
    getKartariAshtadhyayiLink(code, index, kartari, form) {
      return `https://ashtadhyayi.com/dhatu/${code}?tab=ting&scroll=dhatuform-${index}-ting-${kartari}-${form}&scrollcolor=cyan&scrolloffset=400`;
    },
    createDhatu(aupadeshika, gana, sanadi = [], prefixes = []) {
      // Parse upasarga from aupadeshika if present (e.g., "A-hana~" → prefix "A", root "hana~")
      if (aupadeshika && aupadeshika.includes('-')) {
        const segments = aupadeshika.split('-')
        prefixes = [...prefixes, ...segments.slice(0, -1)]
        aupadeshika = segments[segments.length - 1]
      }
      return {
        aupadeshika,
        gana,
        antargana: null,
        sanadi,
        prefixes,
      };
    },
    deriveSubantas(
      devanagariResult,
      aupadeshika,
      gana,
      pratyaya,
      sanadi = [],
      lakara, // Todo: Is this required?
      linga,
      vacana,
      purusha, // Todo: Is this required?
      vibhakti,
      upasargas = [],
    ) {
      let pratipadika;
      if (pratyaya) {
        pratipadika = {
          krdanta: {
            dhatu: this.createDhatu(aupadeshika, gana, sanadi, upasargas),
            krt: pratyaya,
            prefixes: upasargas,
          },
        };
      } else {
        pratipadika = {
          basic: aupadeshika,
        };
      }

      const subanta_result = vidyut
        .deriveSubantas({ pratipadika, linga, vacana, vibhakti })
        .map((result) => ({
          steps: result.history,
          result: Sanscript.t(result.text, "slp1", "devanagari"),
        }));
      const match = subanta_result.filter((res) => res.result == devanagariResult)[0]
      if (match) return match

      // Fallback: try basic pratipadika with derived krdanta stems
      if (pratyaya) {
        const dhatu = this.createDhatu(aupadeshika, gana, sanadi, upasargas)
        const krdStems = vidyut.deriveKrdantas({ dhatu, krt: pratyaya, sanadi: [], upasarga: upasargas, lakara: null, prayoga: null })
        for (const kr of krdStems) {
          const basicResults = vidyut
            .deriveSubantas({ pratipadika: { basic: kr.text }, linga, vacana, vibhakti })
            .map((r) => ({
              steps: kr.history.concat(r.history),
              result: Sanscript.t(r.text, "slp1", "devanagari"),
            }))
          const basicMatch = basicResults.filter((res) => res.result == devanagariResult)[0]
          if (basicMatch) return basicMatch
        }
      }

      // No match — return first result for diagnostic display
      return subanta_result[0]
    },
    deriveKrdantas(devanagariResult, code, pratyaya, gender, vacana, vibhakti) {
      const dhatu = {
        aupadeshika: code,
        gana: "Bhvadi",
        sanadi: [],
        prefixes: [],
        antargana: null,
      };

      const krdanta_result = vidyut
        .deriveKrdantas({
          dhatu: dhatu,
          krt: Sanscript.t(pratyaya, "devanagari", "slp1"),
          sanadi: [],
          upasarga: [],
          lakara: null,
          prayoga: null,
        })
        .map((result) => ({
          steps: result.history,
          // Todo: Need to add linga, vacana and vibhakthi
          title: `${devanagariResult}`,
          result: Sanscript.t(result.text, "slp1", "devanagari"),
        }));

      console.log("krdanta result", krdanta_result);

      // Need to do further Subanta derivation
      if (gender && vacana && vibhakti) {
        const dhatu = vidyut.deriveDhatus(code)[0].text;
        for (var i = 0; i < krdanta_result.length; i++) {
          const subanta_result = this.deriveSubantas(
            devanagariResult,
            Sanscript.t(krdanta_result[i].result, "devanagari", "slp1"),
            gender,
            vacana,
            vibhakti,
          );
          console.log("this is the further subanta result", subanta_result);
          krdanta_result[i] = {
            steps: krdanta_result[i].steps.concat(subanta_result.steps),
            title: subanta_result.title,
            result: subanta_result.result,
          };
        }
      }
      console.log("final krdanta result", krdanta_result);
      return krdanta_result.filter((res) => res.result == devanagariResult)[0];
    },
    deriveTinantas(
      devanagariResult,
      aupadeshika,
      gana,
      lakara,
      pada,
      vacana,
      purusha,
      upasargas = [],
    ) {
      const dhatu = this.createDhatu(aupadeshika, gana, [], upasargas)
      const tinanta_result = vidyut
        .deriveTinantas({
          dhatu,
          lakara,
          vacana,
          purusha,
          prayoga: "Kartari", // Todo: Can this change?
          pada,
          sanadi: [],
          upasarga: dhatu.prefixes,
        })
        .map((result) => ({
          steps: result.history,
          // Todo: Need to add linga, vacana and vibhakthi
          title: `${devanagariResult}`,
          result: Sanscript.t(result.text, "slp1", "devanagari"),
        }));
      const match = tinanta_result.filter((res) => res.result == devanagariResult)[0]
      if (!match && tinanta_result.length > 0) {
        console.log(`tinanta no match for ${devanagariResult}: got [${tinanta_result.map(r => r.result).join(', ')}]`)
      }
      return match || tinanta_result[0] || null;
    },
    getMwExplanation(slp1Word) {
      return {
        content: mwMap[slp1Word],
      };
    },
    showExplanation(devanagariWord, sealId) {
      // If the word ends with anusvara subtitue with /m/ since that's what AA understands
      if (devanagariWord.endsWith("ं")) {
        devanagariWord = devanagariWord.replace(/ं$/, "म्");
      }

      const slp1Word = Sanscript.t(devanagariWord, "devanagari", "slp1");
      let mwDialogContent = null;
      let prakriyaDialogContent = null;
      const {
        mw,
        modifier,
        aupadeshika,
        gana,
        pratyaya,
        sanadi,
        lakara,
        pada,
        linga,
        vacana,
        purusha,
        vibhakti,
      } = wordsMap[slp1Word][sealId] ?? wordsMap[slp1Word]["*"];

      // Todo: We probably dont need this anymore
      // const [type, word] = code.toString().split(":");

      console.log(
        mw,
        modifier,
        aupadeshika,
        gana,
        pratyaya,
        sanadi,
        lakara,
        pada,
        linga,
        vacana,
        purusha,
        vibhakti,
      );

      if (mw) {
        mwDialogContent = this.getMwExplanation(mw);
      }

      switch (modifier) {
        case "sup":
          prakriyaDialogContent = this.deriveSubantas(
            devanagariWord,
            aupadeshika,
            gana,
            pratyaya,
            sanadi ? [sanadi] : [],
            lakara,
            linga,
            vacana,
            purusha,
            vibhakti,
          );
          break;
        case "krt":
          prakriyaDialogContent = this.deriveKrdantas(
            devanagariWord,
            aupadeshika,
            pratyaya,
            linga,
            vacana,
            vibhakti,
          );
          break;
        case "tin":
          prakriyaDialogContent = this.deriveTinantas(
            devanagariWord,
            aupadeshika,
            gana,
            lakara,
            pada,
            vacana,
            purusha,
          );
          break;
      }
      console.log(prakriyaDialogContent);

      this.explanationDialogContent = {
        devanagariWord,
        mwDialogContent,
        prakriyaDialogContent,
      };
      this.showExplanationDialog = true;
    },
  },
  created() {
    // Get from query string parameter or from localStorage if either exists. Preference is given to query string parameter
    function getSearchTerm() {
      const params = new URLSearchParams(window.location.search);
      const searchTerm = params.get("search");
      return searchTerm ?? localStorage.getItem("search");
    }

    this.pageNum = parseInt(localStorage.getItem("page")) || 1;
    this.search = getSearchTerm();

    this.sortBy = JSON.parse(localStorage.getItem("sort")) || this.sortBy;
    this.optionCanonical = localStorage.getItem("canonical") === "true";
    this.optionBroken = localStorage.getItem("broken") === "true";
    this.optionSandhi = localStorage.getItem("sandhi") === "true";
    this.lightTheme = localStorage.getItem("theme") == "light";

    this.debouncedUpdateSearch = (value) => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.updateSearch(value);
      }, 750);
    };

    // Reset to page 1 when a search is active (search + stale pageNum = empty table)
    if (this.search) this.pageNum = 1
  },
  // eslint-disable-next-line vue/order-in-components
  async mounted() {
    document.addEventListener("mouseup", (event) => {
      const classes = Array.from(event.target.classList);
      if (classes.includes("indus1")) this.pasteSearch();
    });
    await Promise.all([initVidyut(), initSandhi()]);
    const dhatupathaText = await (await fetch(dhatupatha)).text();
    vidyut = Vidyut.init(dhatupathaText);
    dhatuIdx = buildDhatuIndex(dhatupathaText)
    sandhiEngine = Sandhi.init();

    // Apply sandhi if the setting was persisted
    if (this.optionSandhi) this.applySandhi();

    // Pre-compute all vidyut derivations to determine badge success/failure
    this.precomputeVidyutResults()

    setTimeout(function () {
      const splashScreen = document.querySelector(".splash");
      if (splashScreen) splashScreen.classList.add("hidden");
    }, 100);
  },
};
</script>

<style>
@font-face {
  font-family: "indus_scriptregular";
  src: url("../assets/fonts/indus-font.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-size: 24pt;
  font-display: swap;
}
.indus {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.sanskrit {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.random {
  white-space: pre;
  color: orange;
}
.v-text-field input {
  font-family: indus_scriptregular;
  font-size: 24pt;
  font-display: swap;
}
.v-toolbar-title__placeholder {
  overflow: visible !important;
}

.v-data-table,
.v-data-table > .v-table,
.v-data-table .v-table__wrapper,
.v-data-table .v-table__wrapper > table {
  width: 100% !important;
  max-width: 100% !important;
}
.v-data-table .v-table__wrapper > table {
  table-layout: fixed !important;
}

.v-data-table table tr th,
.v-data-table table tr td {
  padding: 0 8px !important;
}

/* Inter-column spacing between Inscription and Sanskrit */
.v-data-table table tr td.indus,
.v-data-table table tr th.indus-header,
.v-data-table table tr td.sanskrit,
.v-data-table table tr th.sanskrit-header {
  padding-left: 1.5vw !important;
  padding-right: 1.5vw !important;
}

.hover-image {
  transition: transform 0.3s ease-in-out;
  max-width: 100%; /* Ensures it doesn't overflow */
  max-height: 200px; /* Ensures a consistent height */
}

.hover-image:hover {
  transform: scale(2);
  z-index: 10; /* Brings it above other elements */
}

.v-theme--light {
  .expanded-content {
    background: #f5f5dc;
    color: blue;
  }
}

.v-theme--dark {
  .expanded-content {
    background: black;
    color: yellow;
  }
}

.expanded-info-row {
  display: flex;
  gap: 24px;
  padding: 4px 8px;
  width: 100%;
}
.expanded-site {
  white-space: nowrap;
}
.expanded-description {
  text-align: center;
}
.expanded-notes {
  margin-left: auto;
}

.search-container {
  display: flex;
  flex-direction: column;
}

.seal-mat-steatite img {
  filter: sepia(80%) hue-rotate(320deg) saturate(200%) brightness(100%);
}

.seal-mat-steatite-white img {
  filter: sepia(80%) hue-rotate(320deg) saturate(110%) brightness(80%);
}

.seal-mat-steatite-blue img {
  filter: sepia(40%) hue-rotate(190deg) saturate(250%) brightness(100%)
    contrast(140%);
}

.seal-mat-steatite-grey img {
  filter: sepia(0%) hue-rotate(0deg) saturate(100%) brightness(100%);
}

.seal-mat-clay img {
  filter: sepia(80%) hue-rotate(320deg) saturate(200%) brightness(100%);
}

.seal-mat-clay-grey img {
  filter: sepia(0%) hue-rotate(0deg) saturate(100%) brightness(100%);
}

.seal-mat-copper img {
  filter: sepia(98%) hue-rotate(310deg) saturate(150%) brightness(60%);
}

.sanskrit {
  font-size: 16pt;
  word-spacing: 5pt;
}

.sanskrit-link {
  text-decoration: underline;
  cursor: pointer;
}

.explanation-title {
  font-weight: bold;
  font-size: 16pt;
}

.prakriya-container {
  margin-bottom: 5pt;
}

.explanation-title {
  font-weight: bold !important;
  font-size: 20pt !important;
}

.prakriya-steps {
  font-size: 14pt;
  line-height: 30pt;
  a {
    color: inherit;
  }
}

.explanation-description {
  font-size: 16pt;
  line-height: 30pt;
}

.ashtadhyayi-link {
  text-decoration: none;
  color: inherit;
}

.scrollable-card-text {
  max-height: 80vh; /* Adjust as needed */
  overflow-y: auto;
}

.mw-meaning {
  font-size: 14pt;
  line-height: 28pt;

  lex {
    text-decoration: underline;
  }

  ls {
    color: #8080ff;
  }
  L {
    font-size: 12pt;
  }
}

.v-theme--light L {
  background-color: #eeeeee;
}

.v-theme--dark L {
  background-color: #aaaaaa;
}

.cuneiform {
  white-space: pre;
  font-size: 14pt;
}

.interlinear-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 16px;
  padding: 8px 0;
}

.interlinear-word {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.interlinear-form-row {
  display: flex;
  align-items: center;
}

.interlinear-form {
  font-size: 14pt;
  font-weight: 500;
}

.verify-icon {
  color: #4caf50;
  cursor: pointer;
  margin-left: 3px;
}

.vidyut-badge {
  font-size: 7pt;
  border-radius: 4px;
  padding: 0 3px;
  margin-left: 3px;
  white-space: nowrap;
  line-height: 1.4;
  vertical-align: middle;
  border: 1px solid;
}

.vidyut-badge-success {
  color: #8a6dbf;
  border-color: #8a6dbf;
}

.vidyut-badge-fail {
  color: #c0392b;
  border-color: #c0392b;
}

.vidyut-badge-clickable {
  cursor: pointer;
}
.vidyut-badge-success.vidyut-badge-clickable:hover {
  background: rgba(138, 109, 191, 0.15);
}
.vidyut-badge-fail.vidyut-badge-clickable:hover {
  background: rgba(192, 57, 43, 0.15);
}

.lemma-reference {
  width: 0;
  min-width: 100%;
  overflow-wrap: break-word;
  font-size: 8pt;
  color: #4caf50;
  padding: 2px 0;
}

.vidyut-derivation {
  width: 0;
  min-width: 100%;
  overflow-wrap: break-word;
  padding: 4px 0 2px;
  margin-top: 2px;
  border-top: 1px dashed rgba(138, 109, 191, 0.3);
}

.vidyut-step {
  font-size: 9pt;
  line-height: 1.6;
  color: #8a6dbf;
}

.vidyut-result {
  font-weight: 600;
}

.vidyut-rule-link {
  color: inherit;
  opacity: 0.7;
  font-size: 8pt;
  text-decoration: none;
}
.vidyut-rule-link:hover {
  opacity: 1;
}

.interlinear-analysis {
  font-size: 9pt;
  color: #9a938a;
}

.interlinear-analysis-row,
.interlinear-meaning-row {
  display: flex;
  align-items: center;
}

.edit-icon {
  font-size: 8pt;
  opacity: 0.4;
  margin-left: 2px;
}

.interlinear-meaning {
  font-size: 9pt;
  font-style: italic;
  color: #5a8a5a;
}

/* Mobile card layout */
.mobile-view {
  padding: 0 4px;
}

.mobile-card-header {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 12px;
  align-items: flex-start;
}

.mobile-card-left {
  flex: 0 0 33%;
  max-width: 33%;
}

.mobile-card-right {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
}

.mobile-seal-carousel {
  border-radius: 4px;
  width: 100%;
}

.mobile-card-id-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.mobile-card-id {
  font-size: 10px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carousel-nav-btn {
  width: 22px;
  height: 22px;
  min-width: 22px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-carousel-counter {
  position: absolute;
  bottom: 2px;
  left: 4px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 1px 5px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 3;
}


.zoom-dialog-card {
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.mobile-seal-image {
  border-radius: 4px;
  width: 100%;
  max-height: 100px;
}

.mobile-no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 80px;
  border-radius: 4px;
  border: 1px dashed rgba(128, 128, 128, 0.3);
}

.mobile-indus-text {
  font-size: 18pt;
  text-align: center;
  line-height: 1.2;
}

.mobile-sanskrit-preview {
  font-size: 13pt;
  word-spacing: 3pt;
  white-space: pre-wrap;
  text-align: center;
}

.mobile-cards {
  display: flex;
  flex-direction: column;
}

.mobile-card {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.mobile-panel-title {
  padding: 12px;
}

.mobile-expand-btn {
  flex: 0 0 auto;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  align-self: flex-start;
}

.mobile-detail-row {
  padding: 4px 0;
  font-size: 13px;
  line-height: 1.5;
}

.mobile-label {
  font-weight: 600;
  opacity: 0.7;
  font-size: 11px;
  text-transform: uppercase;
}

.mobile-expanded-outer {
  display: flex;
  justify-content: center;
}

.mobile-expanded-wrapper {
  text-align: left;
  padding: 0 12px 12px;
}

.mobile-interlinear {
  padding: 8px 0;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  margin-top: 8px;
}

.mobile-interlinear .interlinear-container {
  gap: 16px 10px;
}

.v-theme--dark .mobile-card {
  background-color: rgba(255, 255, 255, 0.03);
}

.v-theme--light .mobile-card {
  background-color: rgba(0, 0, 0, 0.02);
}

.mobile-translation-preview {
  display: none;
  font-size: 11pt;
  white-space: pre-wrap;
}


/* Wider mobile: inscription + Sanskrit side by side, right/left aligned */
@media (min-width: 600px) {
  .mobile-card-right {
    flex-direction: row;
    align-items: flex-start;
    gap: 3vw;
  }
  .mobile-indus-text {
    flex: 1 1 0;
    text-align: right;
  }
  .mobile-sanskrit-preview {
    flex: 1 1 0;
    text-align: left;
  }
}

/* Show translation column at wider widths */
@media (min-width: 900px) {
  .mobile-translation-preview {
    display: block;
    flex: 1 1 0;
    text-align: left;
  }
}
</style>
