<template>
  <v-chip class="purple darken-2 white--text">
    <v-tooltip bottom>
      <v-avatar slot="activator" class="purple lighten-1">
        <v-icon>group_work</v-icon>
      </v-avatar>
      <span>Groups</span>
    </v-tooltip>
    {{ nbGroups }}
  </v-chip>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters(['nbGroups'])
  }
}
</script>
