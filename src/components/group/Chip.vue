<template>
  <v-tooltip bottom>
    <v-btn slot="activator" flat router to="/view/group">
      <v-icon class="mr-2">group_work</v-icon>
      {{ nbGroups }}
    </v-btn>
    <span>Groups</span>
  </v-tooltip>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters(['nbGroups'])
  }
}
</script>
