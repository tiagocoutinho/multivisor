<template>
  <v-btn variant="flat" router to="/process" :aria-label="t.navProcesses">
    <v-tooltip activator="parent" location="bottom">{{
      t.navProcesses
    }}</v-tooltip>
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
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { nbRunningProcesses, nbStoppedProcesses } = storeToRefs(store);
</script>
