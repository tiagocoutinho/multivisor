<template>
  <v-data-table
    :headers="headers"
    :items="procs"
    :search="search"
    v-model="selectedProcesses"
    hide-actions
    select-all
    no-results-text="Sorry, no matching processes found"
    no-data-text="Sorry, there are no processes currently being monitored"
    must-sort
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
      <ProcessRow :row="props"
                  :show-supervisor="showSupervisor"
                  :show-group="showGroup"></ProcessRow>
    </template>

    <template slot="expand" slot-scope="props">
      <v-card flat>
        <v-card-text>
          <ProcessDetails :process="props.item"></ProcessDetails>
        </v-card-text>
      </v-card>
    </template>
  </v-data-table>
</template>

<script>
import { stateColorMap } from '../../multivisor'
import ProcessRow from './Row'
import ProcessDetails from './Details'

export default {
  name: 'ProcessTable',
  props: {
    processes: { default: null },
    showGroup: { default: true },
    showSupervisor: { default: true }
  },
  components: { ProcessRow, ProcessDetails },
  data () {
    return {
      stateColorMap: stateColorMap
    }
  },
  computed: {
    headers () {
      let header = [{ align: 'left', sortable: true, text: 'Name', value: 'name', tooltip: 'process name' }]
      if (this.showGroup) {
        header.push({ align: 'left', sortable: true, text: 'Group', value: 'group', tooltip: 'process group', class: 'hidden-xs-only' })
      }
      if (this.showSupervisor) {
        header.push({ align: 'left', sortable: true, text: 'Supervisor', value: 'supervisor', tooltip: 'supervisor controlling process', class: 'hidden-xs-only' })
      }
      header.push({ align: 'left', sortable: true, text: 'State', value: 'statename', tooltip: 'process state' })
      header.push({ align: 'left', sortable: false, text: 'Actions', value: '', tooltip: '(re)start/stop/view log' })
      return header
    },
    search () { return this.$store.state.search },
    selectedProcesses: {
      get () { return this.$store.state.selectedProcesses },
      set (v) { this.$store.commit('updateSelectedProcesses', v) }
    },
    procs () {
      return this.processes || this.$store.getters.processes
    }
  }
}
</script>
