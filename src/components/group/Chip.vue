<template>
  <v-tooltip bottom>
    <v-btn flat slot="activator"
           router to="/view/group"
           class="purple darken-2 white--text">
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
