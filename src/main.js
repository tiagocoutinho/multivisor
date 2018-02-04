import Vue from 'vue'
import App from './App'
import router from './router'
import { store } from './store'
import { longAgo } from './filters/date'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify, {
  theme: {
    primary: colors.brown.lighten1,
    secondary: colors.brown.darken3,
    accent: colors.purple.darken2,
    error: colors.red.base,
    warning: colors.yellow.base,
    info: colors.blue.base,
    success: colors.green.base
  }
})

Vue.filter('longAgo', longAgo)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  created () {
    this.$store.dispatch('load')
  }
})
