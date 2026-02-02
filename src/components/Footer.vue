<template>
  <div>
    <v-footer
      class="d-flex align-center justify-center ga-2 flex-wrap flex-grow-1 py-3"
      color="surface-light"
    >
      <div xs12 py-3 text-xs-center white--text>
        <ProcessChip></ProcessChip>
        <SupervisorChip></SupervisorChip>
        <GroupChip class="mx-2"></GroupChip>
      </div>
      <ActionBar></ActionBar>
    </v-footer>
  </div>
</template>

<script setup>
import ProcessChip from "./process/Chip";
import SupervisorChip from "./supervisor/Chip";
import GroupChip from "./group/Chip";
import ActionBar from "./ActionBar";
</script>
