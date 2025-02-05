<template>
  <div class="header-links v-theme">
    <a href="/" class="header-link">Home</a>
    <a href="/signs" class="header-link">Signs</a>
    <a href="/type" class="header-link">Type</a>
  </div>
  <v-divider />
</template>

<script>
export default {
  name: "HeaderLinks",
};
</script>

<style>
.header-links {
  padding: 12px 10px;
}
.header-link {
  margin-right: 15px;
  text-decoration: none;
}
.header-link:hover {
  margin-right: 15px;
  text-decoration: underline;
}
.header-link:visited {
  text-decoration: none;
  color: inherit;
}
</style>
