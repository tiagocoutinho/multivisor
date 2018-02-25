<template>
  <v-card>
    <v-toolbar dense color="indigo" dark>
      <v-toolbar-title>{{ supervisor.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-list subheader dense
            v-for="(group, index) in supervisor.groups" :key="group.name">
      <v-subheader style="height:24px;" class="indigo lighten-5">
        {{ group.name }}
      </v-subheader>
      <v-list-tile v-for="process in group.processes" :key="process.uid">
        <v-list-tile-action>
          <v-checkbox hide-details v-model="selectedProcesses"
                      :value="process.uid"></v-checkbox>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>{{ process.name }}
          </v-list-tile-title>
        </v-list-tile-content>

        <v-list-tile-action>
          <v-flex justify-end>
            <ProcessState :state="process.statename"></ProcessState>
            <v-btn icon @click="restartProcess(process)">
              <v-icon color="green">
                <template v-if="process.running">autorenew</template>
                <template v-else>play_arrow</template>
              </v-icon>
            </v-btn>
            <v-btn icon @click="stopProcess(process)"
                   :disabled="!process.running">
              <v-icon color="red">stop</v-icon>
            </v-btn>
            <v-menu open-on-hover>
              <v-btn icon small slot="activator"  color="blue--text">
                <v-icon>more_vert</v-icon>
              </v-btn>
              <div class="grey lighten-3">
              <v-btn icon small @click="viewLog(process, 'out')"
                     v-if="process.logfile">
                <v-icon color="blue">description</v-icon>
              </v-btn>
              <v-btn icon small @click="viewLog(process, 'err')"
                     v-if="process.stderr_logfile">
                <v-icon color="orange">description</v-icon>
              </v-btn>
              </div>
            </v-menu>
          </v-flex>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </v-card>
</template>

<script>
import ProcessState from '../process/State'
import ProcessDetails from '../process/Details'

export default {
  props: ['item'],
  components: {
    ProcessState,
    ProcessDetails
  },
  computed: {
    supervisor () { return this.item.item },
    selectedProcesses: {
      get () { return this.$store.state.selectedProcesses },
      set (v) { this.$store.commit('updateSelectedProcesses', v) }
    }
  },
  methods: {
    restartProcess (process) {
      this.$store.dispatch('restartProcesses', [process.uid])
    },
    stopProcess (process) {
      this.$store.dispatch('stopProcesses', [process.uid])
    },
    viewLog (process, stream) {
      this.$store.commit('setLog', {
        process,
        stream,
        visible: true
      })
    }
  }
}
</script>
