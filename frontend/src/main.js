// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import router from './router'

import { Container, Header, Footer, Main } from 'element-ui'
import { Table, TableColumn } from 'element-ui'
import { Button, ButtonGroup, Tag, Message, Notification } from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import App from './App'
import Multivisor from './plugins/multivisor'

Vue.config.productionTip = false;

// Choose element-ui mini size
Vue.prototype.$ELEMENT = { size: 'small' }
Vue.use(Container);
Vue.use(Header);
Vue.use(Footer);
Vue.use(Main);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tag);
Vue.use(Multivisor);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: {
    Container,
    Header,
    Footer,
    Main,
    Button,
    ButtonGroup,
    Table,
    TableColumn,
    Tag,
    App
  },
  template: '<App/>'
})
