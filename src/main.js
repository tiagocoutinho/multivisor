import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { longAgo } from './filters/date'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

Vue.filter('longAgo', longAgo)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  created () {
    this.$store.dispatch('init')
  }
})
