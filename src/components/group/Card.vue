<template>
  <v-card>
    <v-toolbar density="compact" color="purple-darken-2" dark>
      <v-toolbar-title>{{ group.name }}</v-toolbar-title>

      <v-btn
        icon="mdi-autorenew"
        size="small"
        @click="restartSelected()"
        v-show="selectedGroupProcesses.length"
      >
      </v-btn>
      <!-- <v-tooltip location="top" text="(Re)start selected processes"></v-tooltip> -->

      <v-btn
        icon="mdi-stop"
        size="small"
        @click="stopSelected()"
        v-show="selectedGroupProcesses.length"
      >
      </v-btn>
      <!-- <v-tooltip activator="parent" location="top" text="Stop selected processes"></v-tooltip> -->
      <v-btn
        icon="mdi-checkbox-blank-outline"
        size="small"
        @click="clearSelected()"
        v-show="selectedGroupProcesses.length"
      >
      </v-btn>
      <!-- <v-tooltip activator="parent" location="top" text="Clear selection"></v-tooltip> -->
      <v-btn
        icon="mdi-check-all"
        size="small"
        @click="selectAll()"
        v-show="selectedGroupProcesses.length < group.processes.length"
      >
      </v-btn>
      <!-- <v-tooltip activator="parent" location="top" text="Select all"></v-tooltip> -->

      <!-- </template> -->
    </v-toolbar>
    <GroupList :group="group"></GroupList>
  </v-card>
</template>

<script setup>
import { useAppStore } from "@/stores/app";
import GroupList from "./List";

const store = useAppStore();

const { group } = defineProps(["group"]);

const { selectedProcesses } = storeToRefs(store);

const selectedGroupProcesses = computed(() => {
  return selectedProcesses.value.filter((uid) => {
    let g = uid.split(":", 2)[1];
    return g === group.name;
  });
});

const restartSelected = () => {
  store.restartProcesses(selectedProcesses.value);
  clearSelected();
};
const stopSelected = () => {
  store.stopProcesses(selectedProcesses.value);
  clearSelected();
};
const selectAll = () => {
  let puids = group.processes.reduce((processes, process) => {
    processes.push(process.uid);
    return processes;
  }, []);
  store.addSelectedProcesses(puids);
};
const clearSelected = () => {
  store.removeSelectedProcesses(selectedProcesses.value);
};
</script>
