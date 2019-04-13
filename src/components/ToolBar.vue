<template>
  <v-toolbar fixed dark app class="primary">
    <v-menu offset-y nudge-bottom="15" v-show="isAuthenticated && useAuthentication">
      <template slot="activator">
        <v-btn icon slot="activator">
          <v-icon >menu</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-tile @click="logout">
          <v-list-tile-title>Logout</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>

    <v-toolbar-title>
      <router-link to="/" tag="span" style="cursor: pointer">{{ name }}</router-link>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-text-field append-icon="search" clearable single-line hide-details
                  placeholder="Filter..." v-model="search"
                  color="grey lighten-1" v-show="isAuthenticated || !useAuthentication">
    </v-text-field>
    <ActionBar v-show="isAuthenticated || !useAuthentication"></ActionBar>
    <v-toolbar-items v-show="isAuthenticated || !useAuthentication">
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
    isAuthenticated () { return this.$store.state.isAuthenticated },
    useAuthentication () { return this.$store.state.useAuthentication },
    search: {
      get () { return this.$store.state.search },
      set (v) { this.$store.commit('updateSearch', v) }
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout').then(() => { this.$router.push({'name': 'Login'}) })
    }
  }
}
</script>
