<template lang="html">
  <v-speed-dial open-on-hover
                transition="scale-transition" direction="bottom">
    <v-btn slot="activator" small fab hover flat>
      <v-icon>more_vert</v-icon>
    </v-btn>

    <v-tooltip right>
      <v-btn slot="activator" fab small dark color="green darken-2"
             @click="restartSelected()" v-show="selectedProcesses.length">
        <v-icon>autorenew</v-icon>
      </v-btn>
      <span>(Re)start selected processes</span>
    </v-tooltip>
    <v-tooltip right>
      <v-btn slot="activator" fab small dark color="red darken-2"
             @click="stopSelected()" v-show="selectedProcesses.length">
        <v-icon>stop</v-icon>
      </v-btn>
      <span>Stop selected processes</span>
    </v-tooltip>
    <v-tooltip right>
      <v-btn slot="activator" fab small dark color="blue darken-1"
             @click="clearSelected()" v-show="selectedProcesses.length">
        <v-icon>clear_all</v-icon>
      </v-btn>
      <span>Clear selection</span>
    </v-tooltip>
    <v-tooltip right>
      <v-btn slot="activator" fab small dark color="blue darken-1"
             @click="selectAll()">
        <v-icon>select_all</v-icon>
      </v-btn>
      <span>Select all</span>
    </v-tooltip>
  </v-speed-dial>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  computed: {
    selectedProcesses () { return this.$store.state.selectedProcesses }
  },
  methods: {
    ...mapActions(['selectAll', 'clearSelected', 'restartSelected', 'stopSelected'])
  }

}
</script>
