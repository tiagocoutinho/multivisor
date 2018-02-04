<template>
  <v-container><v-layout justify-center>
  <v-card>
    <v-card-title>
      Processes
      <v-spacer></v-spacer>
      <v-text-field
        append-icon="search"
        label="Filter..."
        hint="by name, group, supervisor or state"
        single-line
        clearable
        v-model="searchProcesses"
      ></v-text-field>
    </v-card-title>

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
          <td>
            <v-checkbox primary hide-details v-model="props.selected" >
            </v-checkbox>
          </td>
          <td @click="props.expanded = !props.expanded"
              style="cursor:pointer"
              class="hidden-xs-only" >{{ props.item.group }}</td>
          <td @click="props.expanded = !props.expanded"
              style="cursor:pointer">{{ props.item.name }}</td>
          <td class="hidden-sm-only">{{ props.item.supervisor }}</td>
          <td >{{ props.item.statename }}</td>
          <td class="justify-center layout px-0">
            <v-btn icon class="mx-0" @click="restartProcess(props.item)">
              <v-icon color="teal">play_arrow</v-icon>
            </v-btn>
            <v-btn icon class="mx-0" @click="stopProcess(props.item)">
              <v-icon color="pink">stop</v-icon>
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
            TODO: Process details!
          </v-card-text>
        </v-card>
      </template>
    </v-data-table>
  </v-card>
</v-layout></v-container>
</template>

<script>
export default {
  data () {
    return {
      searchProcesses: '',
      processHeaders: [
        { align: 'left', sortable: true, text: 'Group', value: 'group', tooltip: 'process group', class: 'hidden-xs-only' },
        { align: 'left', sortable: true, text: 'Name', value: 'name', tooltip: 'process name' },
        { align: 'left', sortable: true, text: 'Supervisor', value: 'supervisor', tooltip: 'supervisor controlling proces', class: 'hidden-sm-only' },
        { align: 'left', sortable: true, text: 'State', value: 'statename', tooltip: 'process state' },
        { align: 'left', sortable: false, text: 'Actions', value: '', tooltip: '(re)start/stop/view log' }
      ],
      selectedProcesses: []
    }
  },
  methods: {
    restartProcess (process) {
      this.$store.dispatch('restartProcess', process.uid)
    },
    stopProcess (process) {
      this.$store.dispatch('stopProcess', process.uid)
    }
  },
  computed: {
    processes () {
      return this.$store.getters.loadedProcesses
    }
  }
}
</script>
