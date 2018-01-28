<template>
  <div id="app">
    <router-view :multivisor="multivisor"/>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'Multivisor',
  data() {
    return {
      multivisor: Vue.multivisor,
    }
  },
  created () {
    console.log('Multivisor App created!');
    this.update();
  },
  methods: {
    update() {
      Vue.multivisor.get().then(data => {
          Vue.multivisor.data = data;
      });
    }
  }
}
</script>
