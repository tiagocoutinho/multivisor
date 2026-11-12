<template>
  <v-container fluid class="pa-4">
    <div v-if="supervisor" class="node-detail">
      <div class="node-context">
        <v-breadcrumbs :items="breadcrumbItems">
          <template #divider>
            <v-icon size="15">mdi-chevron-right</v-icon>
          </template>
          <template #item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              @click="item.disabled ? undefined : goHome()"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
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
        <div class="node-context-actions">
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
        </div>
        <span v-if="!supervisor.running" class="text-caption c-attention">
          {{ labels.nodeOfflineHint }}
        </span>
      </div>

      <ProcessView
        :key="nodeName"
        ref="workbench"
        :title="labels.nodeProcesses"
        :processes="nodeProcesses"
        :scope-key="nodeName"
        :node-name="nodeName"
        :data-state="store.dataStatus"
        :labels="labels"
      ></ProcessView>
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

const breadcrumbItems = computed(() => [
  { title: labels.value.navNodes, disabled: false },
  { title: nodeName.value, disabled: true },
]);

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
