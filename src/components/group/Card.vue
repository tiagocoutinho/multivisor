<template>
  <v-card>
    <v-toolbar dense color="purple darken-2" dark>
      <v-toolbar-title>{{ group.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="restartSelected()"
               v-show="selectedProcesses.length">
          <v-icon>autorenew</v-icon>
        </v-btn>
      <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="stopSelected()"
               v-show="selectedProcesses.length">
          <v-icon>stop</v-icon>
        </v-btn>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="clearSelected()"
               v-show="selectedProcesses.length">
          <v-icon>clear_all</v-icon>
        </v-btn>
        <span>Clear selection</span>
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" icon small @click="selectAll()"
               v-show="selectedProcesses.length < group.processes.length">
          <v-icon>done_all</v-icon>
        </v-btn>
        <span>Select all</span>
      </v-tooltip>
    </v-toolbar>
    <GroupList :group="group"></GroupList>
  </v-card>
</template>

<script>
import GroupList from './List'

export default {
  name: 'GroupCard',
  props: ['item'],
  components: {
    GroupList
  },
  computed: {
    group () { return this.item.item },
    selectedProcesses () {
      return this.$store.state.selectedProcesses.reduce((processes, puid) => {
        let group = puid.split(':', 1)[0]
        if (group === this.group.name) {
          processes.push(puid)
        }
        return processes
      }, [])
    }
  },
  methods: {
    restartSelected () {
      this.$store.dispatch('restartProcesses', this.selectedProcesses)
      this.clearSelected()
    },
    stopSelected () {
      this.$store.dispatch('stopProcesses', this.selectedProcesses)
      this.clearSelected()
    },
    selectAll () {
      let puids = this.group.processes.reduce((processes, process) => {
        processes.push(process.uid)
        return processes
      }, [])
      this.$store.commit('addSelectedProcesses', puids)
    },
    clearSelected () {
      this.$store.commit('removeSelectedProcesses', this.selectedProcesses)
    }
  }
}
</script>
