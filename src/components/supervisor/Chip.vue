<template>
  <v-chip class="indigo darken-2 white--text">
    <v-tooltip bottom>
      <v-avatar slot="activator" class="indigo lighten-1">
        <v-icon>visibility</v-icon>
      </v-avatar>
      <span>Supervisors</span>
    </v-tooltip>
    <v-icon class="mr-2">thumb_up</v-icon>
    {{ nbRunningSupervisors }}
    <v-icon class="mx-2">thumb_down</v-icon>
    {{ nbStoppedSupervisors }}
  </v-chip>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'SupervisorChip',
  computed: {
    ...mapGetters(['nbRunningSupervisors', 'nbStoppedSupervisors'])
  }
}
</script>
