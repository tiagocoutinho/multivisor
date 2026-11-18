<template>
  <v-container fluid class="pa-4">
    <div class="page-heading">
      <h2>{{ t.navNodes }}</h2>
      <span class="stat-inline nums">
        {{ store.supervisors.length }} {{ t.nodesUnit }} ·
        <span class="c-running">{{ onlineCount }} {{ t.onlineUnit }}</span> ·
        {{ store.processes.length }} {{ t.procsUnit }} ·
        <span class="c-running">{{ runningCount }} {{ t.runningShort }}</span>
      </span>
      <div class="page-heading-actions">
        <v-btn-toggle
          v-model="homeFilter"
          mandatory
          density="compact"
          variant="outlined"
          divided
          color="primary"
        >
          <v-btn value="all" size="small">{{ t.allNodes }}</v-btn>
          <v-btn value="attention" size="small"
            >{{ t.statAlerts }} {{ attentionCount }}</v-btn
          >
          <v-btn v-if="homeFilter === 'offline'" value="offline" size="small">{{
            t.offline
          }}</v-btn>
        </v-btn-toggle>
      </div>
    </div>
    <div class="health-strip">
      <span class="health-strip-label">{{ t.attentionOverview }}</span>
      <v-btn
        size="small"
        variant="text"
        class="c-danger"
        prepend-icon="mdi-alert-circle-outline"
        :to="{ name: 'processes', query: { state: 'FATAL' } }"
        >{{ t.fatalCount(fatalCount) }}</v-btn
      >
      <v-btn
        size="small"
        variant="text"
        class="c-attention"
        prepend-icon="mdi-timer-sand"
        :to="{ name: 'processes', query: { state: 'BACKOFF' } }"
        >{{ t.retryCount(backoffCount) }}</v-btn
      >
      <v-btn
        size="small"
        variant="text"
        class="c-attention"
        prepend-icon="mdi-lan-disconnect"
        @click="homeFilter = 'offline'"
        >{{ t.offlineCount(offlineCount) }}</v-btn
      >
      <span
        v-if="!alertCount && !offlineCount && !loading"
        class="text-body-2 c-running"
        >{{ t.allHealthy }}</span
      >
    </div>
    <div v-if="loading" class="node-grid" role="status" :aria-label="t.refresh">
      <v-skeleton-loader
        v-for="index in 4"
        :key="index"
        type="heading, list-item-three-line"
        class="node-card"
      ></v-skeleton-loader>
    </div>
    <div v-else-if="visibleSupervisors.length" class="node-grid">
      <OverviewCard
        v-for="supervisor in visibleSupervisors"
        :key="supervisor.name"
        :supervisor="supervisor"
      ></OverviewCard>
    </div>
    <div v-else class="mobile-empty text-body-2 c-neutral">
      {{ emptyMessage }}
    </div>
  </v-container>
</template>

<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import OverviewCard from "@/components/supervisor/OverviewCard";
import { countAlertProcesses, countRunningProcesses } from "@/multivisor";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());
const homeFilter = ref("all");
const loading = computed(() => ["idle", "loading"].includes(store.dataStatus));
const onlineCount = computed(
  () => store.supervisors.filter((node) => node.running).length,
);
const offlineCount = computed(
  () => store.supervisors.length - onlineCount.value,
);
const runningCount = computed(() => countRunningProcesses(store.processes));
const alertCount = computed(() => countAlertProcesses(store.processes));
const fatalCount = computed(
  () =>
    store.processes.filter((process) => process.statename === "FATAL").length,
);
const backoffCount = computed(
  () =>
    store.processes.filter((process) => process.statename === "BACKOFF").length,
);
const needsAttention = (node) =>
  !node.running || countAlertProcesses(Object.values(node.processes)) > 0;
const attentionCount = computed(
  () => store.supervisors.filter(needsAttention).length,
);
const visibleSupervisors = computed(() =>
  store.supervisors.filter((node) => {
    if (homeFilter.value === "offline") return !node.running;
    if (homeFilter.value === "attention") return needsAttention(node);
    return true;
  }),
);
const emptyMessage = computed(() => {
  if (!store.supervisors.length) return t.value.emptyNodes;
  return homeFilter.value === "offline"
    ? t.value.noOfflineNodes
    : t.value.noAttentionNodes;
});
</script>
