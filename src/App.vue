<template>
  <v-app >
    <v-navigation-drawer clipped mini-variant fixed v-model="drawer" app>
      <v-list>
        <v-list-tile v-for="item in menuItems"
                     :key="item.title" :to="item.link">
          <v-list-tile-action>
            <v-icon left>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <!-- <v-list-tile-content v-html="item.title"></v-list-tile-content>-->
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar fixed dark app class="primary">
      <v-toolbar-side-icon @click.stop="drawer = !drawer"
                           class="hidden-sm-and-up">
      </v-toolbar-side-icon>
      <v-toolbar-title>
        <router-link to="/" tag="span" style="cursor:pointer">{{ name }}</router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-xs-only">
        <v-btn flat v-for="item in menuItems"
               :key="item.title" :to="item.link">
          <v-icon left>{{ item.icon }}</v-icon>
          <div v-html="item.title" />
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <router-view></router-view>
      </v-container>
    </v-content>
    <v-footer app fixed class="primary">
      <v-layout wrap align-center>
        <v-chip color="secondary" text-color="white">
          <v-icon left dark>settings</v-icon>
          <v-avatar class="green">{{ nbRunningProcesses }}</v-avatar>
          <v-avatar class="red">{{ nbStoppedProcesses }}</v-avatar>
        </v-chip>
        <v-chip color="secondary" text-color="white">
          <v-icon left dark>visibility</v-icon>
          <v-avatar class="green">{{ nbRunningSupervisors }}</v-avatar>
          <v-avatar class="red">{{ nbStoppedSupervisors }}</v-avatar>
        </v-chip>
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script>
  import {mapGetters} from 'vuex'

  export default {
    data () {
      return {
        drawer: false,
        menuItems: [
          { icon: 'settings', title: 'Processes', link: '/processes' },
          { icon: 'visibility', title: 'Supervisors', link: '/supervisors' }
        ]
      }
    },
    computed: {
      ...mapGetters(['nbRunningProcesses', 'nbStoppedProcesses', 'totalNbProcesses',
        'nbRunningSupervisors', 'nbStoppedSupervisors', 'totalNbSupervisors']),
      name () {
        return this.$store.state.multivisor.name
      }
    }
  }
</script>
