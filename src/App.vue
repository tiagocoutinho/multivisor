<template>
  <v-app >
    <v-toolbar fixed dense dark app class="primary">
      <v-toolbar-title class="hidden-xs-only">{{ name }}</v-toolbar-title>
      <v-spacer class="hidden-xs-only"></v-spacer>
      <v-toolbar-items>
      <v-tooltip bottom>
        <v-btn slot="activator" icon @click="restartSelected()"
               :disabled="!selectedProcesses.length">
          <v-icon large color="green darken-1">autorenew</v-icon>
        </v-btn>
        <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn slot="activator" icon @click="stopSelected()"
               :disabled="!selectedProcesses.length">
          <v-icon large color="red darken-4">stop</v-icon>
        </v-btn>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-text-field append-icon="search" color="grey lighten-1"
                    clearable single-line
                    placeholder="Filter..." class="mx-3 mt-2"
                    v-model="searchProcesses">
      </v-text-field>
      <v-chip class="deep-purple darken-2 white--text mx-2 hidden-xs-only">
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
      <v-chip class="indigo darken-2 white--text mx-2 hidden-xs-only">
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
        <v-layout justify-center>
          <v-card>
          <v-data-table
            :headers="processHeaders"
            :items="processes"
            :search="searchProcesses"
            v-model="selectedProcesses"
            hide-actions
            select-all
            item-key='uid'
            class="elevation-4">

            <template slot="headerCell" slot-scope="props">
              <v-tooltip bottom>
                <span slot="activator">
                  {{ props.header.text }}
                </span>
                <span>
                  {{ props.header.tooltip }}
                </span>
              </v-tooltip>
            </template>

            <template slot="items" slot-scope="props">
              <tr>
                <td class="px-0"
                    style="height:30px;">
                  <v-checkbox primary hide-details v-model="props.selected" >
                  </v-checkbox>
                </td>
                <td @click="props.expanded = !props.expanded"
                    class="hidden-xs-only px-0"
                    style="cursor:pointer;height:30px;">
                    {{ props.item.group }}
                </td>
                <td @click="props.expanded = !props.expanded"
                    class="px-0"
                    style="cursor:pointer;height:30px;">
                    {{ props.item.name }}
                </td>
                <td class="hidden-xs-only px-0" style="height:30px;">
                  {{ props.item.supervisor }}
                </td>
                <td class="px-0" style="height:30px;">
                  <v-chip label :color="stateColorMap[props.item.statename]"
                          text-color="white" small>
                          {{ props.item.statename }}
                  </v-chip>
                </td>

                <td class="justify-center layout px-0">
                    <v-btn icon small @click="restartProcess(props.item)">
                      <v-icon color="green">
                        <template v-if="props.item.running">autorenew</template>
                        <template v-else>play_arrow</template>
                      </v-icon>
                    </v-btn>
                  <v-btn icon small @click="stopProcess(props.item)"
                         :disabled="!props.item.running">
                    <v-icon color="red">stop</v-icon>
                  </v-btn>
                </td>
              </tr>
            </template>

            <template slot="no-data">
              <div>Sorry, there are no processes currently being monitored</div>
            </template>

            <template slot="no-results">
              <div>Sorry, no matching processes found</div>
            </template>

            <template slot="expand" slot-scope="props">
              <v-card flat>
                <v-card-text>
                  <ProcessDetails :process="props.item"></ProcessDetails>
                </v-card-text>
              </v-card>
            </template>
          </v-data-table>
        </v-card>
        </v-layout>
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
  import ProcessDetails from './components/process/Details'

  export default {
    components: {
      ProcessDetails
    },
    data () {
      return {
        stateColorMap: {
          'STOPPED': 'grey',
          'STARTING': 'blue',
          'RUNNING': 'green',
          'BACKOFF': 'orange',
          'STOPPING': 'blue',
          'EXITED': 'orange',
          'FATAL': 'red',
          'UNKNOWN': 'black'
        },
        logMap: {
          DEBUG: 'grey darken-2',
          INFO: 'grey darken-3',
          WARNING: 'orange',
          ERROR: 'error'
        },
        processHeaders: [
          { align: 'left', sortable: true, text: 'Group', value: 'group', tooltip: 'process group', class: 'hidden-xs-only' },
          { align: 'left', sortable: true, text: 'Name', value: 'name', tooltip: 'process name' },
          { align: 'left', sortable: true, text: 'Supervisor', value: 'supervisor', tooltip: 'supervisor controlling proces', class: 'hidden-xs-only' },
          { align: 'left', sortable: true, text: 'State', value: 'statename', tooltip: 'process state' },
          { align: 'left', sortable: false, text: 'Actions', value: '', tooltip: '(re)start/stop/view log' }
        ],
        searchProcesses: '',
        selectedProcesses: [],
        snackbar: {
          visible: false,
          color: 'info'
        }
      }
    },
    watch: {
      lastLogRecord (newRecord) {
        this.snackbar.visible = true
        this.snackbar.color = this.logMap[newRecord.level]
      }
    },
    methods: {
      restartProcess (process) {
        this.$store.dispatch('restartProcesses', [process.uid])
      },
      stopProcess (process) {
        this.$store.dispatch('stopProcesses', [process.uid])
      },
      restartSelected () {
        let uids = this.selectedProcesses.map(process => process.uid)
        this.$store.dispatch('restartProcesses', uids)
        this.selectedProcesses = []
      },
      stopSelected () {
        let uids = this.selectedProcesses.map(process => process.uid)
        this.$store.dispatch('stopProcesses', uids)
        this.selectedProcesses = []
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
      },
      processes () {
        return this.$store.getters.loadedProcesses
      }
    }
  }
</script>
