import Vue from 'vue'
import Router from 'vue-router'
import Signin from '@/components/user/Signin'
import Signup from '@/components/user/Signup'
import Profile from '@/components/user/Profile'
import Processes from '@/components/process/Processes'
import Supervisors from '@/components/supervisor/Supervisors'

Vue.use(Router)

export default new Router({
  routes: [
    { path: '/', name: 'Home', component: Processes },
    { path: '/signin', name: 'Signin', component: Signin },
    { path: '/signup', name: 'Signup', component: Signup },
    { path: '/profile', name: 'Profile', component: Profile },
    { path: '/processes', name: 'Processes', component: Processes },
    { path: '/supervisors', name: 'Supervisors', component: Supervisors }
  ],
  mode: 'history'
})
