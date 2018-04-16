<template>
  <v-card>
    <v-toolbar dense color="indigo" dark>
      <v-toolbar-title>{{ supervisor.name }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-tooltip top>
        <v-btn slot="activator" icon small @click="restartSelectedProcesses()"
               v-show="selectedProcesses.length">
          <v-icon>autorenew</v-icon>
        </v-btn>
        <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="stopSelectedProcesses()"
               v-show="selectedProcesses.length">
          <v-icon>stop</v-icon>
        </v-btn>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="clearSelectedProcesses()"
               v-show="selectedProcesses.length">
          <v-icon>clear_all</v-icon>
        </v-btn>
        <span>Clear selection</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="selectAllProcesses()"
               v-show="selectedProcesses.length < Object.keys(supervisor.processes).length">
          <v-icon>done_all</v-icon>
        </v-btn>
        <span>Select all</span>
      </v-tooltip>

      <v-menu bottom left>
        <v-btn icon slot="activator">
          <v-icon>more_vert</v-icon>
        </v-btn>
        <v-list>
          <v-list-tile @click="updateSupervisor()">
            <v-list-tile-title>Update</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="restartSupervisor()">
            <v-list-tile-title>Restart</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar>
    <SupervisorList :supervisor="supervisor"></SupervisorList>
  </v-card>
</template>

<script>
import SupervisorList from './List'

export default {
  name: 'SupervisorCard',
  props: ['item'],
  components: {
    SupervisorList
  },
  computed: {
    supervisor () { return this.item.item },
    selectedProcesses () {
      let procs = this.$store.state.selectedProcesses.reduce((processes, puid) => {
        let supervisor = puid.split(':', 1)[0]
        if (supervisor === this.supervisor.name) {
          processes.push(puid)
        }
        return processes
      }, [])
      return procs
    }
  },
  methods: {
    updateSupervisor () {
      this.$store.dispatch('updateSupervisor', this.supervisor.name)
    },
    restartSupervisor () {
      this.$store.dispatch('restartSupervisor', this.supervisor.name)
    },
    restartSelectedProcesses () {
      this.$store.dispatch('restartProcesses', this.selectedProcesses)
      this.clearSelectedProcesses()
    },
    stopSelectedProcesses () {
      this.$store.dispatch('stopProcesses', this.selectedProcesses)
      this.clearSelectedProcesses()
    },
    selectAllProcesses () {
      let puids = []
      for (let pname in this.supervisor.processes) {
        puids.push(this.supervisor.processes[pname].uid)
      }
      this.$store.commit('addSelectedProcesses', puids)
    },
    clearSelectedProcesses () {
      this.$store.commit('removeSelectedProcesses', this.selectedProcesses)
    }
  }
}
</script>
