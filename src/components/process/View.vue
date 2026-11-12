<template>
  <div class="process-workspace">
    <div class="page-heading">
      <h2>{{ title }}</h2>
      <span class="stat-inline">
        {{ filteredProcesses.length }} / {{ processes.length }}
        {{ labels.procsUnit }} ·
        <span class="c-running"
          >{{ runningCount }} {{ labels.runningShort }}</span
        >
        <template v-if="alertCount">
          ·
          <button
            type="button"
            class="process-name c-attention"
            @click="quickFilter = 'alerts'"
          >
            {{ alertCount }} {{ labels.statAlerts }}
          </button>
        </template>
      </span>
    </div>

    <div class="filter-toolbar">
      <v-btn-toggle
        v-model="quickFilter"
        mandatory
        density="compact"
        variant="outlined"
        divided
        color="primary"
        class="quick-filters"
      >
        <v-btn value="all">{{ labels.quickAllN(processes.length) }}</v-btn>
        <v-btn value="alerts">{{ labels.quickAlertsN(alertCount) }}</v-btn>
      </v-btn-toggle>

      <div class="toolbar-utilities">
        <v-tooltip location="bottom" :text="labels.selectFiltered">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              :aria-label="labels.selectFiltered"
              :disabled="!filteredProcesses.length || dataState !== 'ready'"
              @click="selectFiltered"
            >
              <v-icon size="18">mdi-check-all</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip
          v-if="hasActiveFilters"
          location="bottom"
          :text="labels.clearFilters"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              :aria-label="labels.clearFilters"
              @click="clearFilters"
            >
              <v-icon size="18">mdi-filter-off-outline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <div v-if="selectedUids.length" class="selection-bar">
        <div class="selection-copy">
          <strong>{{
            labels.selectionSummary(selectedUids.length, selectionGroups.length)
          }}</strong>
        </div>
        <v-btn
          size="small"
          variant="text"
          icon
          :title="labels.reviewSelection"
          :aria-label="labels.reviewSelection"
          :aria-expanded="showSelectionList"
          @click="showSelectionList = !showSelectionList"
        >
          <v-icon size="18">
            {{
              showSelectionList ? "mdi-chevron-up" : "mdi-format-list-bulleted"
            }}
          </v-icon>
        </v-btn>
        <v-btn size="small" variant="text" @click="clearSelection">
          {{ labels.clearSelection }}
        </v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-autorenew"
          :disabled="!actionsAvailable"
          @click="requestProcessAction('restart')"
        >
          {{ labels.restartN(selectedUids.length) }}
        </v-btn>
        <v-btn
          size="small"
          color="error"
          variant="tonal"
          prepend-icon="mdi-stop"
          :disabled="!stopAvailable"
          @click="requestProcessAction('stop')"
        >
          {{ labels.stopN(selectedUids.length) }}
        </v-btn>
      </div>

      <div class="toolbar-filters">
        <v-select
          v-model="stateFilter"
          class="state-filter"
          :items="stateFilterOptions"
          :label="labels.filterState"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <v-select
          v-if="!nodeName"
          v-model="nodeFilter"
          class="node-filter"
          :items="nodeFilterOptions"
          :label="labels.filterNode"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
        <v-text-field
          v-model.trim="search"
          class="process-search"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          :label="labels.searchPh"
          variant="outlined"
          hide-details
          single-line
          clearable
        ></v-text-field>
      </div>
    </div>

    <div
      v-if="selectedUids.length && (selectedHiddenCount || !actionsAvailable)"
      class="selection-notice c-attention"
    >
      <span v-if="selectedHiddenCount">{{
        labels.selectedHidden(selectedInViewCount, selectedHiddenCount)
      }}</span>
      <span v-if="!actionsAvailable" :class="{ 'ml-2': selectedHiddenCount }">{{
        labels.selectionUnavailable
      }}</span>
    </div>
    <div v-if="showSelectionList && selectedUids.length" class="selection-list">
      <div
        v-for="group in selectionGroups"
        :key="group.supervisor"
        class="selection-group"
      >
        <div class="selection-group-name mono">{{ group.supervisor }}</div>
        <div class="selection-group-items">
          <span
            v-for="process in group.processes"
            :key="process.uid"
            class="mono"
          >
            {{ process.name }}
          </span>
        </div>
      </div>
    </div>

    <ProcessTable
      :processes="filteredProcesses"
      :supervisors="store.supervisors"
      :inspected-uid="inspector.visible ? inspector.uid : ''"
      v-model:selected-uids="selectedUids"
      :labels="labels"
      :node-name="nodeName"
      :show-supervisor="nodeName === undefined"
      :data-state="dataState"
      :has-source-processes="processes.length > 0"
      :has-active-filters="hasActiveFilters"
      :connected="store.connected"
      :data-ready="dataState === 'ready'"
      :node-running="nodeRunning"
      :pending-uids="store.pendingProcessUids"
      :supervisors-pending="store.pendingSupervisorNames.length > 0"
      @inspect="openInspector"
      @action="requestAction"
      @update:current-uids="currentUids = $event"
      @clear-filters="clearFilters"
    ></ProcessTable>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";

import { countAlertProcesses, countRunningProcesses } from "@/multivisor";
import { useProcessView } from "@/composables/useProcessView";
import { useAppStore } from "@/stores/app";
import { useInspectorStore } from "@/stores/inspector";

import ProcessTable from "./Table.vue";

const props = defineProps({
  title: { type: String, required: true },
  processes: { type: Array, required: true },
  scopeKey: { type: String, required: true },
  nodeName: { type: String, default: undefined },
  dataState: { type: String, default: "ready" },
  labels: { type: Object, required: true },
});

const store = useAppStore();
const inspector = useInspectorStore();

const view = useProcessView({
  source: computed(() => props.processes),
  scopeKey: computed(() => props.scopeKey),
  labels: computed(() => props.labels),
});

const {
  search,
  quickFilter,
  stateFilter,
  nodeFilter,
  selectedUids,
  filteredProcesses,
  selectedItems,
  selectionGroups,
  selectedHiddenCount,
  selectedInViewCount,
  hasActiveFilters,
  selectFiltered,
  clearSelection,
  clearFilters,
} = view;

const showSelectionList = ref(false);
const currentUids = ref([]);
const seenAcceptedResults = new WeakSet();

const breakpoint = useDisplay();
const isNarrow = computed(() => breakpoint.width.value <= 640);

const runningCount = computed(() => countRunningProcesses(props.processes));
const alertCount = computed(() => countAlertProcesses(props.processes));
const nodeRunning = computed(() =>
  props.nodeName
    ? (store.supervisors.find((node) => node.name === props.nodeName)
        ?.running ?? false)
    : true,
);

const selectedNodesRunning = computed(() =>
  selectedItems.value.every((process) =>
    store.supervisors.some(
      (node) => node.name === process.supervisor && node.running,
    ),
  ),
);

const selectedNodesPending = computed(() =>
  selectedItems.value.some((process) =>
    store.pendingSupervisorNames.includes(process.supervisor),
  ),
);

const stateFilterOptions = computed(() => {
  const knownStates = Object.keys(props.labels.stateNames);
  const currentStates = [
    ...new Set(props.processes.map((item) => item.statename)),
  ].sort((left, right) => left.localeCompare(right));
  const missingStates = knownStates.filter(
    (state) => !currentStates.includes(state),
  );

  return [
    { title: props.labels.filterAll, value: "" },
    ...currentStates.map((state) => ({
      title: stateName(state),
      value: state,
    })),
    ...missingStates.map((state) => ({
      title: stateName(state),
      value: state,
    })),
  ];
});

const nodeFilterOptions = computed(() => {
  const nodeNames = [
    ...new Set(props.processes.map((item) => item.supervisor)),
  ].sort((left, right) => left.localeCompare(right));
  return [
    { title: props.labels.filterAll, value: "" },
    ...nodeNames.map((node) => ({ title: node, value: node })),
  ];
});

function stateName(state) {
  return props.labels.stateNames[state] || state;
}

function openInspector({ process, panel }) {
  inspector.open(process.uid, panel);
}

function requestAction({ process, action }) {
  store.requestProcessAction([process.uid], action);
}

function requestProcessAction(action) {
  store.requestProcessAction(selectedUids.value, action);
}

const actionsAvailable = computed(
  () =>
    store.connected &&
    props.dataState === "ready" &&
    selectedItems.value.length > 0 &&
    selectedNodesRunning.value &&
    !store.pendingProcessUids.length &&
    !store.pendingSupervisorNames.length &&
    !selectedNodesPending.value,
);
const stopAvailable = computed(
  () =>
    actionsAvailable.value &&
    selectedItems.value.every((process) => process.running),
);

function clearView() {
  clearSelection();
  clearFilters();
}

watch(
  [filteredProcesses, isNarrow, currentUids],
  ([processes, narrow, visibleUids]) => {
    inspector.setOrder(
      narrow ? processes.map((process) => process.uid) : visibleUids,
    );
  },
);

watch(
  () => store.operationResults,
  (results) => {
    const acceptedUids = [];
    for (const result of results) {
      if (
        result.requestState !== "accepted" ||
        seenAcceptedResults.has(result)
      ) {
        continue;
      }
      seenAcceptedResults.add(result);
      acceptedUids.push(result.uid);
    }
    if (acceptedUids.length) {
      selectedUids.value = selectedUids.value.filter(
        (uid) => !acceptedUids.includes(uid),
      );
    }
  },
  { deep: true },
);

function applyFilters(filters) {
  quickFilter.value = filters.quick === "alerts" ? "alerts" : "all";
  stateFilter.value = filters.state || "";
  nodeFilter.value = props.nodeName === undefined ? filters.node || "" : "";
}

defineExpose({
  applyFilters,
  clearView,
  clearFilters,
  clearSelection,
  filteredProcesses,
  hasActiveFilters,
  selectedUids,
});
</script>
