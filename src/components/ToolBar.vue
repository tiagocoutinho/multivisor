<template>
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
                  v-model="search">
    </v-text-field>
    <ProcessChip class="mx-2 hidden-xs-only"></ProcessChip>
    <SupervisorChip class="mx-2 hidden-xs-only"></SupervisorChip>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
  import ProcessChip from './process/Chip'
  import SupervisorChip from './supervisor/Chip'

  export default {
    components: {
      ProcessChip,
      SupervisorChip
    },
    computed: {
      name () {
        return this.$store.state.multivisor.name
      },
      search: {
        get () { return this.$store.state.search },
        set (v) { this.$store.commit('updateSearch', v) }
      },
      selectedProcesses: {
        get () { return this.$store.state.selectedProcesses },
        set (v) { this.$store.commit('updateSelectedProcesses', v) }
      }
    },
    methods: {
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
    }
  }
</script>
