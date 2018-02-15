<template>
  <v-app >
    <v-toolbar fixed dense dark app class="primary">
      <v-toolbar-title>
        <router-link to="/" tag="span" style="cursor:pointer">{{ name }}</router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
      <v-tooltip bottom>
        <v-btn slot="activator" icon @click="restartSelected()">
          <v-icon large color="green darken-4">play_arrow</v-icon>
        </v-btn>
        <span>Start selected processes</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn slot="activator" icon @click="stopSelected()">
          <v-icon large color="red darken-4">stop</v-icon>
        </v-btn>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-text-field append-icon="search"
                    clearable single-line
                    placeholder="Filter..." class="mx-3 mt-2">
      </v-text-field>
      <v-chip class="deep-purple darken-2 white--text mx-2">
        <v-tooltip bottom>
          <v-avatar slot="activator" class="deep-purple">
            <v-icon>settings</v-icon>
          </v-avatar>
          <span>Processes</span>
        </v-tooltip>
        <v-icon class="mr-2">thumb_up</v-icon>
        {{ nbRunningProcesses }}
        <v-icon class="mx-2">thumb_down</v-icon>
        {{ nbStoppedProcesses }}
      </v-chip>
      <v-chip class="indigo darken-2 white--text mx-2">
        <v-tooltip bottom>
          <v-avatar slot="activator" class="indigo">
            <v-icon>visibility</v-icon>
          </v-avatar>
          <span>Supervisors</span>
        </v-tooltip>
        <v-icon class="mr-2">thumb_up</v-icon>
        {{ nbRunningSupervisors }}
        <v-icon class="mx-2">thumb_down</v-icon>
        {{ nbStoppedSupervisors }}
      </v-chip>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <router-view></router-view>
      </v-container>
    </v-content>
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
          { icon: 'settings', title: 'Processes', link: '/processes' }
          /* hide supervisor view for now
          { icon: 'visibility', title: 'Supervisors', link: '/supervisors' }
          */
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
