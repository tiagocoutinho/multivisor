<template>
  <v-container fluid class="pa-4">
    <div v-if="supervisor" class="node-detail">
      <ProcessView
        :key="nodeName"
        ref="workbench"
        :processes="nodeProcesses"
        :scope-key="nodeName"
        :node-name="nodeName"
        :data-state="store.dataStatus"
        :labels="labels"
      >
        <!-- v2.4 下钻头：返回 + 节点名即标题一行，替代"面包屑 + 通用标题"两行，
             去掉与主导航重复的"节点总览" -->
        <template #heading="{ countLabel, runningCount }">
          <v-btn
            icon
            variant="text"
            size="small"
            :aria-label="labels.backToNodes"
            :title="labels.backToNodes"
            @click="goHome"
          >
            <v-icon size="20">mdi-chevron-left</v-icon>
          </v-btn>
          <h2 class="mono">{{ nodeName }}</h2>
          <span
            class="node-connection"
            :class="supervisor.running ? 'c-running' : 'c-attention'"
          >
            <v-icon size="8">mdi-circle</v-icon>
            {{ supervisor.running ? labels.online : labels.offline }}
          </span>
          <span v-if="supervisor.url" class="text-caption mono c-neutral">
            {{ supervisor.url }}
          </span>
          <span class="stat-inline">
            {{ countLabel }} ·
            <span class="c-running"
              >{{ runningCount }} {{ labels.runningShort }}</span
            >
          </span>
          <span v-if="!supervisor.running" class="text-caption c-attention">
            {{ labels.nodeOfflineHint }}
          </span>
          <div class="page-heading-actions">
            <template v-if="supervisor.running">
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-update"
                :disabled="!canControlNode"
                :loading="store.pendingSupervisorNames.includes(nodeName)"
                @click="requestNodeAction('update')"
              >
                {{ labels.update }}
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-restart"
                :disabled="!canControlNode"
                :loading="store.pendingSupervisorNames.includes(nodeName)"
                @click="requestNodeAction('restart')"
              >
                {{ labels.restartNode }}
              </v-btn>
            </template>
          </div>
        </template>
      </ProcessView>
    </div>

    <div v-else-if="store.dataStatus === 'ready'">
      <v-alert type="warning" variant="tonal">
        {{ labels.nodeNotFound }}
      </v-alert>
      <v-btn class="mt-4" color="primary" @click="goHome">
        {{ labels.backToNodes }}
      </v-btn>
    </div>

    <div v-else>
      <v-skeleton-loader
        type="list-item-two-line, table-tfoot"
        class="rounded-lg"
      ></v-skeleton-loader>
    </div>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import ProcessView from "@/components/process/View.vue";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

definePage({
  name: "supervisor-detail",
  props: true,
});

const props = defineProps({
  name: { type: String, required: true },
});

const store = useAppStore();
const preferences = usePreferencesStore();
const { labels } = storeToRefs(preferences);

const route = useRoute();
const router = useRouter();

const nodeName = computed(() => props.name);

const supervisor = computed(() =>
  store.supervisors.find((item) => item.name === nodeName.value),
);

const nodeProcesses = computed(() =>
  store.processes.filter((process) => process.supervisor === nodeName.value),
);

const workbench = ref(null);

watch(
  [
    computed(() => ({
      quick: route.query.quick,
      state: route.query.state,
      node: route.query.node,
    })),
    workbench,
  ],
  ([filters]) => {
    workbench.value?.applyFilters(filters);
  },
  { immediate: true },
);

const canControlNode = computed(
  () =>
    store.connected &&
    store.dataStatus === "ready" &&
    supervisor.value.running &&
    !store.pendingProcessUids.length &&
    !store.pendingSupervisorNames.length,
);

function requestNodeAction(action) {
  store.requestSupervisorAction(nodeName.value, action);
}

function goHome() {
  router.push({ name: "/" });
}
</script>
