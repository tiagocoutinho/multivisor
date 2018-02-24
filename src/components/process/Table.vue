<template>
  <v-data-table
    :headers="processHeaders"
    :items="processes"
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
      <ProcessRow :row="props"></ProcessRow>
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
  components: { ProcessRow, ProcessDetails },
  data () {
    return {
      stateColorMap: stateColorMap,
      processHeaders: [
        { align: 'left', sortable: true, text: 'Name', value: 'name', tooltip: 'process name' },
        { align: 'left', sortable: true, text: 'Group', value: 'group', tooltip: 'process group', class: 'hidden-xs-only' },
        { align: 'left', sortable: true, text: 'Supervisor', value: 'supervisor', tooltip: 'supervisor controlling proces', class: 'hidden-xs-only' },
        { align: 'left', sortable: true, text: 'State', value: 'statename', tooltip: 'process state' },
        { align: 'left', sortable: false, text: 'Actions', value: '', tooltip: '(re)start/stop/view log' }
      ]
    }
  },
  computed: {
    search () { return this.$store.state.search },
    processes () { return this.$store.getters.loadedProcesses },
    selectedProcesses: {
      get () { return this.$store.state.selectedProcesses },
      set (v) { this.$store.commit('updateSelectedProcesses', v) }
    }
  }
}
</script>
