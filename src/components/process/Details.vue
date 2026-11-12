<template>
  <v-bottom-sheet inset v-model="visible">
    <v-card>
      <v-card-title>{{ t.updatedAt(lastUpdate) }}</v-card-title>
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
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const startTime = () => {
  return new Date(process.value.start);
};

const items = computed(() => [
  { id: "name", label: t.value.colName, color: "red" },
  { value: startTime, label: t.value.dStart, color: "red darken-2" },
  { id: "description", label: t.value.dDescription, color: "orange" },
  { id: "host", label: t.value.dHost, color: "green" },
  { id: "supervisor", label: t.value.colSupervisor, color: "green darken-2" },
  { id: "pid", label: t.value.dPid, color: "blue" },
  { id: "exitstatus", label: t.value.dExit, color: "blue darken-2" },
  { id: "logfile", label: t.value.dOutLog, color: "purple" },
  { id: "stderr_logfile", label: t.value.dErrLog, color: "purple darken-2" },
]);

const { processDetails } = storeToRefs(store);

const process = computed(() => {
  return processDetails.value.process;
});

const visible = computed({
  get() {
    return processDetails.value.visible;
  },
  set(newValue) {
    store.setProcessDetailsVisible(newValue);
  },
});

const lastUpdate = computed(() => {
  return timeAgo(processDetails.value.process.now, t.value.timeAgo);
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
