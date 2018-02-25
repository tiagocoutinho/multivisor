<template>
  <v-bottom-sheet inset v-model="visible">
    <v-card>
      <v-card-title>Last updated {{ lastUpdate }}</v-card-title>
      <v-list dense>
        <template v-for="(item, index) in items">
          <v-list-tile avatar :key="item.id" v-if="showItem(item)">
            <v-list-tile-avatar :color="item.color">
              <span class="white--text headline">{{ item.label[0] }}</span>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ itemValue(item) }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ item.label }}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider inset v-if="index < (items.length - 2)"></v-divider>
        </template>
      </v-list>
  </v-card>
  </v-bottom-sheet>
</template>

<script>
import { timeAgo } from '../../multivisor'

export default {
  name: 'ProcessDetails',
  data () {
    return {
      items: [
        {id: 'name', label: 'Name', color: 'red'},
        {value: this.startTime, label: 'Started at (last)', color: 'red darken-2'},
        {id: 'description', label: 'Description', color: 'orange'},
        {id: 'host', label: 'Host', color: 'green'},
        {id: 'supervisor', label: 'Supervisor', color: 'green darken-2'},
        {id: 'pid', label: 'PID', color: 'blue'},
        {id: 'exitstatus', label: 'Exit status (last)', color: 'blue darken-2'},
        {id: 'logfile', label: 'Output log file', color: 'purple'},
        {id: 'stderr_logfile', label: 'Error log file', color: 'purple darken-2'}
      ]
    }
  },
  computed: {
    process () { return this.$store.state.processDetails.process },
    visible: {
      get () { return this.$store.state.processDetails.visible },
      set (v) { this.$store.commit('setProcessDetailsVisible', v) }
    },
    lastUpdate () { return timeAgo(this.process.now) }
  },
  methods: {
    startTime () { return Date(this.process.start) },
    showItem (item) { return 'value' in item || this.process[item.id] !== '' },
    itemValue (item) {
      if ('id' in item) {
        return this.process[item.id]
      }
      return item.value()
    }
  }
}
</script>
