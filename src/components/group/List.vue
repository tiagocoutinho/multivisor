<template lang="html">
  <div>
  <v-list dense>
    <template v-for="process in group.processes">
      <ProcessTile :process="process"></ProcessTile>
    </template>
  </v-list>
</div>
</template>

<script>
import ProcessTile from '../process/Tile'

export default {
  name: 'GroupList',
  props: ['group'],
  components: {
    ProcessTile
  }
}
</script>
