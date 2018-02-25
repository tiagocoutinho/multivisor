<template>
  <v-tooltip bottom>
    <v-btn slot="activator" flat
           router to="/view/supervisor"
           class="indigo darken-2 white--text">
      <v-icon class="mr-2">visibility</v-icon>
      <div>
      <v-icon small>thumb_up</v-icon>
      {{ nbRunningSupervisors }}
      <v-icon small class="ml-1">thumb_down</v-icon>
      {{ nbStoppedSupervisors }}
    </div>
    </v-btn>
    <span>Supervisors</span>
  </v-tooltip>
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
