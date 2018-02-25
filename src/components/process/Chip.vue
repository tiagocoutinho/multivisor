<template>
  <v-chip class="deep-purple darken-2 white--text">
    <v-tooltip bottom>
      <v-avatar slot="activator" class="deep-purple lighten-1">
        <v-icon>settings</v-icon>
      </v-avatar>
      <span>Processes</span>
    </v-tooltip>
    <v-icon class="mr-2">thumb_up</v-icon>
    {{ nbRunningProcesses }}
    <v-icon class="mx-2">thumb_down</v-icon>
    {{ nbStoppedProcesses }}
  </v-chip>
</template>

<script>
  import { mapGetters } from 'vuex'
  export default {
    name: 'ProcessChip',
    computed: {
      ...mapGetters(['nbRunningProcesses', 'nbStoppedProcesses'])
    }
  }
</script>
