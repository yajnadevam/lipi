<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  //
  onMounted(hook)

  function hook () {
    setTimeout(function () {
      const splashScreen = document.querySelector('.splash')
      if (splashScreen) splashScreen.classList.add('hidden')
    }, 500)
  }
</script>
