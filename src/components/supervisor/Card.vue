<template>
  <v-card>
    <v-toolbar density="compact" :color="toolbarColor" dark>
      <!-- <template v-slot:prepend>
        <v-icon>mdi-desktop-classic</v-icon>
      </template> -->

      <v-toolbar-title
        >{{ supervisor.name }}
        <span v-if="inactive">(offline)</span></v-toolbar-title
      >
      <v-spacer></v-spacer>

      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            size="small"
            @click="restartSelectedProcesses()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-autorenew</v-icon>
          </v-btn>
        </template>
        <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            size="small"
            @click="stopSelectedProcesses()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-stop</v-icon>
          </v-btn>
        </template>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            size="small"
            @click="clearSelectedProcesses()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-checkbox-blank-outline</v-icon>
          </v-btn>
        </template>
        <span>Clear selection</span>
      </v-tooltip>
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            size="small"
            @click="selectAllProcesses()"
            v-show="
              selectedProcesses.length < Object.keys(supervisor.processes).length
            "
            v-bind="props"
          >
            <v-icon>mdi-check-all</v-icon>
          </v-btn>
        </template>
        <span>Select all</span>
      </v-tooltip>

      <v-menu v-if="!inactive" location="bottom left">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="updateSupervisor()">
            <v-list-item-title>Update</v-list-item-title>
          </v-list-item>
          <v-list-item @click="restartSupervisor()">
            <v-list-item-title>Restart</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    <SupervisorList :supervisor="supervisor"></SupervisorList>
  </v-card>
</template>

<script setup>
import SupervisorList from "./List";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { supervisor } = defineProps(["supervisor"]);

const inactive = computed(() => {
  return !supervisor.running;
});
const toolbarColor = computed(() => {
  return inactive.value ? "grey lighten-1" : "purple-darken-2";
});
const selectedProcesses = computed(() => {
  let procs = store.selectedProcesses.reduce((processes, puid) => {
    let supervisorName = puid.split(":", 1)[0];
    if (supervisorName === supervisor.name) {
      processes.push(puid);
    }
    return processes;
  }, []);
  return procs;
});

const updateSupervisor = () => {
  store.requestSupervisorUpdate(supervisor.name);
};
const restartSupervisor = () => {
  store.restartSupervisor(supervisor.name);
};
const restartSelectedProcesses = () => {
  store.restartProcesses(selectedProcesses.value);
  clearSelectedProcesses();
};
const stopSelectedProcesses = () => {
  store.stopProcesses(selectedProcesses.value);
  clearSelectedProcesses();
};
const selectAllProcesses = () => {
  let puids = [];
  for (let pname in supervisor.processes) {
    puids.push(supervisor.processes[pname].uid);
  }
  store.addSelectedProcesses(puids);
};
const clearSelectedProcesses = () => {
  store.removeSelectedProcesses(selectedProcesses.value);
};
</script>
