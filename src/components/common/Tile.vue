<template lang="html">
  <v-list-item>
    <template v-slot:prepend>
      <v-checkbox
        hide-details
        v-model="selectedProcesses"
        :value="process.uid"
      ></v-checkbox>
    </template>

    <v-list-item-title>{{ process.name }}</v-list-item-title>

    <template v-slot:append>
      <ProcessState :state="process.statename"></ProcessState>
      <v-btn flat icon @click="restartProcess(process)">
        <v-icon color="green">
          <template v-if="process.running">mdi-autorenew</template>
          <template v-else>mdi-play</template>
        </v-icon>
      </v-btn>
      <v-btn flat icon @click="stopProcess(process)" :disabled="!process.running">
        <v-icon color="red">mdi-stop</v-icon>
      </v-btn>
      <v-menu open-on-hover>
        <template v-slot:activator="{ props }">
          <v-btn flat  icon="mdi-dots-vertical" v-bind="props"></v-btn>
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
    </template>
  </v-list-item>
</template>

<script setup>
import ProcessState from "./State";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { process } = defineProps(["process"]);

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
