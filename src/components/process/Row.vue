<template>
  <tr>
    <!-- <td class="px-0" style="height: 30px">
      <v-checkbox
        primary
        hide-details
        v-model="selectedProcesses"
        :value="process.uid"
      >
      </v-checkbox>
    </td> -->
    <td class="px-0" style="height: 30px">
      {{ process.name }}
    </td>
    <td v-if="showGroup" class="hidden-xs px-0" style="height: 30px">
      {{ process.group }}
    </td>
    <td v-if="showSupervisor" class="hidden-xs px-0" style="height: 30px">
      {{ process.supervisor }}
    </td>
    <td class="px-0" style="height: 30px">
      <v-chip
        label
        :color="stateColorMap[process.statename]"
        size="small"
      >
        {{ process.statename }}
      </v-chip>
    </td>

    <td class="layout px-0" style="height: 30px">
      <v-btn
        icon flat
        size="small"
        @click="restartProcess(process)"
        class="mx-0 my-1"
      >
        <v-icon color="green">
          <template v-if="process.running">mdi-autorenew</template>
          <template v-else>mdi-play</template>
        </v-icon>
      </v-btn>
      <v-btn
        icon flat
        size="small"
        @click="stopProcess(process)"
        :disabled="!process.running"
        class="mx-0 my-1"
      >
        <v-icon color="red">mdi-stop</v-icon>
      </v-btn>
      <v-menu open-on-hover>
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-dots-vertical" flat v-bind="props"></v-btn>
        </template>
        <v-list>
          <v-list-item @click="viewDetails(process)">
            <v-list-item-title
              ><v-icon size="small">mdi-information</v-icon>
              Info</v-list-item-title
            >
          </v-list-item>
          <v-list-item @click="viewLog(process, 'out')" v-if="process.logfile">
            <v-list-item-title
              ><v-icon size="small">mdi-file-document-alert-outline</v-icon>Log
              stdout</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            @click="viewLog(process, 'err')"
            v-if="process.stderr_logfile"
          >
            <v-list-item-title
              ><v-icon size="small">mdi-file-document-alert-outline</v-icon>Log
              stderr</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-menu>
    </td>
  </tr>
</template>

<script setup>
import { stateColorMap } from "@/multivisor";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { process, showSupervisor, showGroup } = defineProps([
  "process",
  "show-supervisor",
  "show-group",
]);

// const process = computed(() => {
//   console.log(row)
//   return row
// })
const selectedProcesses = computed({
  get() {
    return store.selectedProcesses;
  },
  set(newValue) {
    store.setSelectedProcesses(newValue);
  },
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
