<template>
  <v-tooltip bottom>
    <v-btn slot="activator" flat
           router to="/view/process"
           class="deep-purple darken-2 white--text">
      <v-icon class="mr-2">settings</v-icon>
      <div>
      <v-icon small>thumb_up</v-icon>
      {{ nbRunningProcesses }}
      <v-icon small class="ml-1">thumb_down</v-icon>
      {{ nbStoppedProcesses }}
    </div>
    </v-btn>
    <span>Processes</span>
  </v-tooltip>
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
