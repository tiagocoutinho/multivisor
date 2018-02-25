<template>
  <v-card>
    <v-toolbar dense color="indigo" dark>
      <v-toolbar-title>{{ supervisor.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-list subheader dense
            v-for="(group, index) in supervisor.groups" :key="group.name">
      <v-subheader style="height:24px;" class="indigo lighten-5">
        {{ group.name }}
      </v-subheader>
      <template v-for="process in group.processes">
        <ProcessTile :process="process"></ProcessTile>
      </template>
    </v-list>
  </v-card>
</template>

<script>
import ProcessTile from '../process/Tile'

export default {
  props: ['item'],
  components: {
    ProcessTile
  },
  computed: {
    supervisor () { return this.item.item }
  }
}
</script>
