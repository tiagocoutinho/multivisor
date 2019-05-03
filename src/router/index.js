import Vue from 'vue'
import Router from 'vue-router'
import GroupPage from '@/components/group/Page'
import ProcessPage from '@/components/process/Page'
import SupervisorPage from '@/components/supervisor/Page'
import LoginPage from '@/components/login/Page'
import store from '../store'

Vue.use(Router)

const loginRequired = {meta: {requiresAuth: true}}
const router = new Router({
  routes: [
    {path: '/', name: 'Home', component: GroupPage, ...loginRequired},
    {path: '/login', name: 'Login', component: LoginPage},
    {path: '/view/group', name: 'GroupPage', component: GroupPage, ...loginRequired},
    {path: '/view/supervisor', name: 'SupervisorPage', component: SupervisorPage, ...loginRequired},
    {path: '/view/process', name: 'ProcessPage', component: ProcessPage, ...loginRequired}
  ],
  mode: 'history'
})

router.beforeEach(async function (to, from, next) {
  if (store.state.useAuthentication === undefined || store.state.isAuthenticated === undefined) {
    const response = await fetch('/api/auth')
    if (response.status === 504) {
      return next()
    }
    const data = await response.json()
    store.commit('setUseAuthentication', data.use_authentication)
    store.commit('setIsAuthenticated', data.is_authenticated)
  }
  if (!store.state.useAuthentication) {
    if (to.name === 'Login') { return next({name: 'Home'}) }
    return next()
  }
  const loginRequiredRoute = to.matched.some(route => route.meta.requiresAuth)
  // if user is not authenticated and route requires login -> redirect to login page
  if (!store.state.isAuthenticated && loginRequiredRoute) {
    return next({name: 'Login'})
  }
  // if user is authenticated and navigates to login page -> redirect to home page
  if (to.name === 'Login' && store.state.isAuthenticated) {
    return next({name: 'Home'})
  }
  return next()
})

export default router
