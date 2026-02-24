<template>
  <v-bottom-sheet inset v-model="visible">
    <v-card>
      <v-card-title>Last updated {{ lastUpdate }}</v-card-title>
      <v-list density="compact">
        <template v-for="(item, index) in items">
          <v-list-item
            avatar
            :subtitle="item.label"
            :title="itemValue(item)"
            :key="item.id"
            v-if="showItem(item)"
          >
            <template v-slot:prepend>
              <v-avatar :color="item.color">
                <span class="text-white text-h5">{{ item.label[0] }}</span>
              </v-avatar>
            </template>
          </v-list-item>
          <!-- <v-divider inset v-if="index < items.length - 2"></v-divider> -->
        </template>
      </v-list>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { timeAgo } from "@/multivisor";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const startTime = () => {
  return Date(process.start);
};

const items = [
  { id: "name", label: "Name", color: "red" },
  { value: startTime, label: "Started at (last)", color: "red darken-2" },
  { id: "description", label: "Description", color: "orange" },
  { id: "host", label: "Host", color: "green" },
  { id: "supervisor", label: "Supervisor", color: "green darken-2" },
  { id: "pid", label: "PID", color: "blue" },
  { id: "exitstatus", label: "Exit status (last)", color: "blue darken-2" },
  { id: "logfile", label: "Output log file", color: "purple" },
  { id: "stderr_logfile", label: "Error log file", color: "purple darken-2" },
];

const { processDetails } = storeToRefs(store);

// const process = computed(() => {
//   return processDetails.value.process;
// });

const visible = computed({
  get() {
    return processDetails.value.visible;
  },
  set(newValue) {
    store.setProcessDetailsVisible(newValue);
  },
});

const lastUpdate = computed(() => {
  return timeAgo(processDetails.value.process.now);
});

const showItem = (item) => {
  return "value" in item || processDetails.value.process[item.id] !== "";
};

const itemValue = (item) => {
  let res;
  if ("id" in item) {
    res = processDetails.value.process[item.id];
  } else {
    res = item.value();
  }
  return res;
};
</script>
