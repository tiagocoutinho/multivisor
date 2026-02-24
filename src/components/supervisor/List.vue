<template lang="html">
  <div>
    <v-list
      density="compact"
      v-for="(group, index) in supervisor.groups"
      :key="group.name"
    >
      <v-divider v-if="index > 0"></v-divider>
      <v-list-subheader style="height: 24px">
        {{ group.name }}
      </v-list-subheader>
      <template v-for="process in group.processes">
        <ProcessTile :process="process"></ProcessTile>
      </template>
    </v-list>
  </div>
</template>

<script>
import ProcessTile from "../common/Tile";

export default {
  name: "SupervisorList",
  props: ["supervisor"],
  components: {
    ProcessTile,
  },
};
</script>
