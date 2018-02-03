// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import router from './router'

import { Container, Row, Col, Header, Footer, Main } from 'element-ui'
import { Table, TableColumn, Button, ButtonGroup } from 'element-ui'
import { Tooltip, Tag, Message, Notification, Input } from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import App from './App'
import Multivisor from './plugins/multivisor'

Vue.config.productionTip = false;

// Choose element-ui mini size
Vue.prototype.$ELEMENT = { size: 'small' }
Vue.use(Container);
Vue.use(Row);
Vue.use(Col);
Vue.use(Header);
Vue.use(Footer);
Vue.use(Main);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Tooltip);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tag);
Vue.use(Input);
Vue.use(Multivisor);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: {
    Container,
    Header,
    Footer,
    Row,
    Col,
    Main,
    Button,
    ButtonGroup,
    Tooltip,
    Table,
    TableColumn,
    Tag,
    Input,
    App
  },
  template: '<App/>'
})
