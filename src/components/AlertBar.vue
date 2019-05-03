<template>
    <v-alert :value="error" type="error" transition="scale-transition">{{error}}</v-alert>
</template>

<script>
  export default {
    name: 'AlertBar',
    computed: {
      error () {
        return this.$store.state.error
      }
    }
  }
</script>
