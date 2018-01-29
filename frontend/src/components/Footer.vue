<template>
  <div class="navbar navbar-bottom">{{ log }}</div>
</template>

<script>
export default {
  name: 'Footer',
  props: ['multivisor'],
  computed: {
    log() {
      let log = this.multivisor.log;
      if (log) {
        return log.level + ' at ' + Date(log.time*1000) + ': ' + log.message;
      }
      return '';
    }
  },
}
</script>

<style scoped>
nav { width:100%; height: 20px;
      position: fixed;
      bottom: 0;
      background-color: rgb(240, 205, 205); }
</style>
