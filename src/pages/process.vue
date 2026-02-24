<template>
  <v-container justify-center>
    <v-data-table
      :headers="headers"
      :items="procs"
      :search="search"
      v-model="selectedProcesses"
      hide-actions
      select-all
      no-results-text="Sorry, no matching processes found"
      no-data-text="Sorry, there are no processes currently being monitored"
      must-sort
      show-select
      item-key="uid"
      class="elevation-4"
    >
      <template v-slot:item.statename="{ item }">
        <!-- <ProcessRow
          :process="item"
          :show-supervisor="showSupervisor"
          :show-group="showGroup"
        ></ProcessRow> -->

        <v-chip
          label
          variant="flat"
          :color="stateColorMap[item.statename]"
          :text="item.statename"
          size="small"
        >
        </v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon flat
          size="small"
          @click="restartProcess(item)"
          class="mx-0 my-1"
        >
          <v-icon color="green">
            <template v-if="item.running">mdi-autorenew</template>
            <template v-else>mdi-play</template>
          </v-icon>
        </v-btn>
        <v-btn
          icon flat
          size="small"
          @click="stopProcess(item)"
          :disabled="!item.running"
          class="mx-0 my-1"
        >
          <v-icon color="red">mdi-stop</v-icon>
        </v-btn>
        <v-menu open-on-hover>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" flat v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item @click="viewDetails(item)">
              <v-list-item-title
                ><v-icon size="small">mdi-information</v-icon>
                Info</v-list-item-title
              >
            </v-list-item>
            <v-list-item @click="viewLog(item, 'out')" v-if="item.logfile">
              <v-list-item-title
                ><v-icon size="small">mdi-file-document-alert-outline</v-icon>Log
                stdout</v-list-item-title
              >
            </v-list-item>
            <v-list-item
              @click="viewLog(item, 'err')"
              v-if="item.stderr_logfile"
            >
              <v-list-item-title
                ><v-icon size="small">mdi-file-document-alert-outline</v-icon>Log
                stderr</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
//import ProcessRow from "@/components/process/Row";
import { stateColorMap } from "@/multivisor";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { processes, showGroup, showSupervisor } = defineProps({
  processes: { default: null },
  showGroup: { default: true },
  showSupervisor: { default: true },
});

const headers = computed(() => {
  let header = [
    {
      align: "left",
      sortable: true,
      title: "Name",
      value: "name",
      tooltip: "process name",
    },
  ];
  if (showGroup) {
    header.push({
      align: "left",
      sortable: true,
      title: "Group",
      value: "group",
      tooltip: "process group",
      class: "hidden-xs-only",
    });
  }
  if (showSupervisor) {
    header.push({
      align: "left",
      sortable: true,
      title: "Supervisor",
      value: "supervisor",
      tooltip: "supervisor controlling process",
      class: "hidden-xs-only",
    });
  }
  header.push({
    align: "left",
    sortable: true,
    title: "State",
    value: "statename",
    tooltip: "process state",
  });
  header.push({
    align: "left",
    sortable: false,
    title: "Actions",
    value: "actions",
    tooltip: "(re)start/stop/view log",
  });
  return header;
});

const search = computed(() => {
  return store.search;
});

const selectedProcesses = computed({
  get() {
    return store.selectedProcesses;
  },
  set(newValue) {
    store.setSelectedProcesses(newValue);
  },
});

const procs = computed(() => {
  return processes || store.processes;
});

const restartProcess = (process) => {
  store.restartProcesses([process.uid]);
};
const stopProcess = (process) => {
  store.stopProcesses([process.uid]);
};
const viewLog = (process, stream) => {
  store.setLog({
    process,
    stream,
    visible: true,
  });
};
const viewDetails = (process) => {
  store.setProcessDetails({
    process,
    visible: true,
  });
};
</script>
