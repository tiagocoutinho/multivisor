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
    <v-footer app fixed color="primary">
      <v-layout row justify-center>
        <v-flex xs2>
          <v-chip label color="green" text-color="white">
            <v-avatar>
              <v-icon class="green darken-2">settings</v-icon>
            </v-avatar>
            {{ nbRunningProcesses }}
          </v-chip>
          <v-chip label color="red" text-color="white">
            <v-avatar>
              <v-icon class="red darken-2">settings</v-icon>
            </v-avatar>
            {{ nbStoppedProcesses }}
          </v-chip>
        </v-flex>
        <v-flex xs2>
          <v-chip label color="green" text-color="white">
            <v-avatar>
              <v-icon class="green darken-2">visibility</v-icon>
            </v-avatar>
            {{ nbRunningSupervisors }}
          </v-chip>
          <v-chip label color="red" text-color="white">
            <v-avatar>
              <v-icon class="red darken-2">visibility</v-icon>
            </v-avatar>
            {{ nbStoppedSupervisors }}
          </v-chip>
        </v-flex>
      </v-layout>
    </v-footer>
    <v-snackbar :timeout="5000" bottom right :color="snackbar.color"
                v-model="snackbar.visible">
      {{ lastLogRecord.message }}
    </v-snackbar>
  </v-app>
</template>

<script>
  import {mapGetters} from 'vuex'

  export default {
    data () {
      return {
        log_map: {
          DEBUG: 'grey darken-2',
          INFO: 'grey darken-3',
          WARNING: 'orange',
          ERROR: 'error'
        },
        drawer: false,
        snackbar: {
          visible: false,
          color: 'info'
        },
        menuItems: [
          { icon: 'settings', title: 'Processes', link: '/processes' },
          { icon: 'visibility', title: 'Supervisors', link: '/supervisors' }
        ]
      }
    },
    watch: {
      lastLogRecord (newRecord) {
        this.snackbar.visible = true
        this.snackbar.color = this.log_map[newRecord.level]
      }
    },
    computed: {
      ...mapGetters(['nbRunningProcesses', 'nbStoppedProcesses', 'totalNbProcesses',
        'nbRunningSupervisors', 'nbStoppedSupervisors', 'totalNbSupervisors']),
      name () {
        return this.$store.state.multivisor.name
      },
      lastLogRecord () {
        let n = this.$store.state.log.length
        if (n) {
          return this.$store.state.log[n - 1]
        } else {
          return { message: '' }
        }
      }
    }
  }
</script>
