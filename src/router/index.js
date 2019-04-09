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

router.beforeEach((to, from, next) => {
  const authenticated = store.state.isAuthenticated
  const loginRequiredRoute = to.matched.some(route => route.meta.requiresAuth)
  // if user is not authenticated route requires login -> redirect to login page
  if (!authenticated && loginRequiredRoute) {
    return next({name: 'Login'})
  }
  // if user is authenticated and navigates to login page -> redirect to home page
  if (to.name === 'Login' && authenticated) {
    return next({name: 'Home'})
  }
  return next()
})

export default router
