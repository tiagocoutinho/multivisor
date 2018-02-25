<template>
  <tr>
    <td class="px-0"
        style="height:30px;">
      <v-checkbox primary hide-details v-model="row.selected" >
      </v-checkbox>
    </td>
    <td @click="row.expanded = !row.expanded"
      class="px-0"
      style="cursor:pointer;height:30px;">
      {{ row.item.name }}
    </td>
    <td v-if="showGroup"
        @click="row.expanded = !row.expanded"
        class="hidden-xs-only px-0"
        style="cursor:pointer;height:30px;">
        {{ row.item.group }}
    </td>
    <td v-if="showSupervisor"
        class="hidden-xs-only px-0" style="height:30px;">
      {{ row.item.supervisor }}
    </td>
    <td class="px-0" style="height:30px;">
      <v-chip disabled label :color="stateColorMap[row.item.statename]"
              text-color="white" small>
              {{ row.item.statename }}
      </v-chip>
    </td>

    <td class="layout px-0" style="height:30px;">
      <v-btn icon small @click="restartProcess(row.item)"  class="mx-0 my-1">
        <v-icon color="green">
          <template v-if="row.item.running">autorenew</template>
          <template v-else>play_arrow</template>
        </v-icon>
      </v-btn>
      <v-btn icon small @click="stopProcess(row.item)"
             :disabled="!row.item.running" class="mx-0 my-1">
        <v-icon color="red">stop</v-icon>
      </v-btn>
      <v-menu open-on-hover auto>
        <v-btn icon small slot="activator" dark color="blue--text" class="mx-0 my-1">
          <v-icon>more_vert</v-icon>
        </v-btn>
        <div class="grey lighten-3">
        <v-btn icon small @click="viewLog(row.item, 'out')"
               v-if="row.item.logfile">
          <v-icon color="blue">description</v-icon>
        </v-btn>
        <v-btn icon small @click="viewLog(row.item, 'err')"
               v-if="row.item.stderr_logfile">
          <v-icon color="orange">description</v-icon>
        </v-btn>
        </div>
      </v-menu>
    </td>
  </tr>
</template>

<script>
import { stateColorMap } from '../../multivisor'

export default {
  name: 'ProcessRow',
  props: [ 'row', 'show-supervisor', 'show-group' ],
  data () { return { stateColorMap: stateColorMap } },
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
