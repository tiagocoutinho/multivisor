<template>
  <v-btn variant="flat" router to="/process">
    <v-tooltip activator="parent" location="bottom">Processes</v-tooltip>
    <v-icon class="mr-2">mdi-cog</v-icon>
    <div>
      <v-icon size="small">mdi-thumb-up</v-icon>
      {{ nbRunningProcesses }}
      <v-icon size="small" class="ml-1">mdi-thumb-down</v-icon>
      {{ nbStoppedProcesses }}
    </div>
  </v-btn>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { nbRunningProcesses, nbStoppedProcesses } = storeToRefs(store);
</script>
