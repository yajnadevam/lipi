<template>
  <v-app>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { hideSplashScreen } from '@/utils/splash.js'

onMounted(() => {
  hideSplashScreen();
});
</script>
