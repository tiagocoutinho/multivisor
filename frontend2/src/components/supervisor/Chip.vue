<template>
  <v-btn variant="flat" router to="/supervisor" :aria-label="t.navNodes">
    <v-tooltip activator="parent" location="bottom">{{ t.navNodes }}</v-tooltip>
    <v-icon class="mr-2">mdi-desktop-classic</v-icon>
    <div>
      <v-icon size="small">mdi-thumb-up</v-icon>
      {{ nbRunningSupervisors }}
      <v-icon size="small" class="ml-1">mdi-thumb-down</v-icon>
      {{ nbStoppedSupervisors }}
    </div>
  </v-btn>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { nbRunningSupervisors, nbStoppedSupervisors } = storeToRefs(store);
</script>
