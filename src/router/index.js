import Vue from 'vue'
import Router from 'vue-router'
import GroupPage from '@/components/group/Page'
import ProcessPage from '@/components/process/Page'
import SupervisorPage from '@/components/supervisor/Page'
import LoginPage from '@/components/login/Page'

Vue.use(Router)

export default new Router({
  routes: [
    {path: '/', name: 'Home', component: GroupPage},
    {path: '/login', name: 'login', component: LoginPage},
    {path: '/view/group', name: 'GroupPage', component: GroupPage},
    {path: '/view/supervisor', name: 'SupervisorPage', component: SupervisorPage},
    {path: '/view/process', name: 'ProcessPage', component: ProcessPage}
  ],
  mode: 'history'
})
