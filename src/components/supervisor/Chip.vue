<template>
  <v-btn slot="activator" variant="flat" router to="/supervisor">
    <v-tooltip activator="parent" location="bottom">Supervisors</v-tooltip>
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

const store = useAppStore();

const { nbRunningSupervisors, nbStoppedSupervisors } = storeToRefs(store);
</script>
