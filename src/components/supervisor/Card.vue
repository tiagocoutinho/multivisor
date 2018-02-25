<template>
  <v-card>
    <v-toolbar dense color="indigo" dark>
      <v-toolbar-title>{{ supervisor.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <SupervisorList :supervisor="supervisor"></SupervisorList>
  </v-card>
</template>

<script>
import SupervisorList from './List'

export default {
  props: ['item'],
  components: {
    SupervisorList
  },
  computed: {
    supervisor () { return this.item.item }
  }
}
</script>
