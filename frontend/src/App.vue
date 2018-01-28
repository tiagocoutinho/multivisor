<template>
  <div id="app">
    <router-view :multivisor="multivisor" :data="data" />
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'Multivisor',
  data() {
    return {
      data: {},
      multivisor: Vue.multivisor,
    }
  },
  created () {
    console.log('Multivisor App created!');
    this.update();
  },
  methods: {
    update: function() {
      Vue.multivisor.get().then(data => {
          Vue.multivisor.data = data;
          this.data = data;
      });
    }
  }
}
</script>
