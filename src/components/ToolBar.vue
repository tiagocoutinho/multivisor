<template>
  <v-toolbar fixed dark app class="primary">
    <v-toolbar-title>
      <router-link to="/" tag="span" style="cursor: pointer">{{ name }}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-text-field append-icon="search" clearable single-line hide-details
                  placeholder="Filter..." v-model="search"
                  color="grey lighten-1">
    </v-text-field>
    <ActionBar></ActionBar>
    <v-toolbar-items>
      <ProcessChip class="hidden-sm-and-down"></ProcessChip>
      <SupervisorChip class="hidden-sm-and-down"></SupervisorChip>
      <GroupChip class="hidden-sm-and-down"></GroupChip>
    </v-toolbar-items>
  </v-toolbar>
</template>

<script>
import { mapGetters } from 'vuex'
import ProcessChip from './process/Chip'
import SupervisorChip from './supervisor/Chip'
import GroupChip from './group/Chip'
import ActionBar from './ActionBar'

export default {
  name: 'ToolBar',
  components: { ActionBar, ProcessChip, SupervisorChip, GroupChip },
  computed: {
    ...mapGetters(['name']),
    search: {
      get () { return this.$store.state.search },
      set (v) { this.$store.commit('updateSearch', v) }
    }
  }
}
</script>
