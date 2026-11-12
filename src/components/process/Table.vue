<template>
  <template v-if="dataState === 'idle' || dataState === 'loading'">
    <div v-if="isNarrow" class="mobile-process-list">
      <v-skeleton-loader
        v-for="item in 4"
        :key="item"
        type="list-item-two-line"
        class="rounded-lg"
      ></v-skeleton-loader>
    </div>
    <v-card v-else elevation="0" class="overflow-hidden table-card">
      <v-data-table
        :headers="headers"
        :items="[]"
        loading
        density="compact"
        hide-default-footer
      >
        <template #loading>
          <tr v-for="row in 6" :key="row">
            <td v-for="column in headers.length + 1" :key="column" class="py-3">
              <v-skeleton-loader
                type="text"
                style="max-width: 64%"
              ></v-skeleton-loader>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </template>

  <div v-else-if="isNarrow" class="mobile-process-list">
    <article
      v-for="process in processes"
      :key="process.uid"
      class="mobile-process"
      :class="{
        'row-selected': selectedUids.includes(process.uid),
        'row-inspected': inspectedUid === process.uid,
      }"
    >
      <div class="mobile-process-top">
        <v-checkbox-btn
          :model-value="selectedUids.includes(process.uid)"
          :value="process.uid"
          :aria-label="labels.selectProcess(process.name)"
          density="compact"
          color="primary"
          @update:model-value="toggleProcess(process.uid, $event)"
        ></v-checkbox-btn>
        <button
          type="button"
          class="process-name mobile-process-name mono"
          :title="`${labels.info} · ${process.name}`"
          @click="inspect(process, 'details')"
        >
          {{ process.name }}
        </button>
        <v-chip
          label
          size="x-small"
          variant="tonal"
          :class="['st-chip', stateClassMap[process.statename]]"
          :text="stateName(process.statename)"
        ></v-chip>
      </div>
      <div class="mobile-process-meta">
        <template v-if="showGroup">{{ process.group }}</template>
        <template v-if="showGroup && useSupervisorColumn"> · </template>
        <span v-if="useSupervisorColumn" class="mono">{{
          process.supervisor
        }}</span>
      </div>
      <div class="mobile-process-bottom">
        <span
          v-if="process.pid !== undefined"
          class="text-caption mono c-neutral"
        >
          PID {{ process.pid }}
        </span>
        <ProcessActions
          :process="process"
          :labels="labels"
          :enabled="canControlProcess(process)"
          :pending="isPending(process)"
          @inspect="emit('inspect', $event)"
          @action="requestAction(process, $event)"
        ></ProcessActions>
      </div>
    </article>
    <div v-if="!processes.length" class="mobile-empty">
      <v-icon size="28" class="c-neutral mb-2">mdi-magnify</v-icon>
      <div class="text-body-2">
        {{ hasSourceProcesses ? labels.noResult : labels.emptyProcesses }}
      </div>
      <v-btn
        v-if="hasActiveFilters"
        class="mt-3"
        size="small"
        variant="tonal"
        @click="emit('clearFilters')"
      >
        {{ labels.clearFilters }}
      </v-btn>
    </div>
  </div>

  <v-card v-else elevation="0" class="overflow-hidden table-card">
    <v-data-table
      :model-value="selectedUids"
      :headers="headers"
      :items="processes"
      :row-props="rowProps"
      density="compact"
      show-select
      select-strategy="all"
      item-value="uid"
      :items-per-page="25"
      :items-per-page-options="[25, 50, 100]"
      @update:model-value="setSelectedUids"
      @update:current-items="setCurrentUids"
    >
      <template #no-data>
        <div class="text-body-2 pa-5">
          {{ hasSourceProcesses ? labels.noResult : labels.emptyProcesses }}
        </div>
        <v-btn
          v-if="hasActiveFilters"
          class="mb-4"
          size="small"
          variant="tonal"
          @click="emit('clearFilters')"
        >
          {{ labels.clearFilters }}
        </v-btn>
      </template>
      <template #item.name="{ item }">
        <button
          type="button"
          class="process-name mono"
          :title="`${labels.info} · ${item.name}`"
          @click="inspect(item, 'details')"
        >
          {{ item.name }}
        </button>
      </template>
      <template v-if="showGroup" #item.group="{ item }">
        <span class="mono">{{ item.group }}</span>
      </template>
      <template v-if="useSupervisorColumn" #item.supervisor="{ item }">
        <span class="mono">{{ item.supervisor }}</span>
      </template>
      <template #item.statename="{ item }">
        <v-chip
          label
          variant="tonal"
          :class="['st-chip', stateClassMap[item.statename]]"
          :text="stateName(item.statename)"
          size="small"
        ></v-chip>
      </template>
      <template #item.actions="{ item }">
        <ProcessActions
          :process="item"
          :labels="labels"
          :enabled="canControlProcess(item)"
          :pending="isPending(item)"
          @inspect="emit('inspect', $event)"
          @action="requestAction(item, $event)"
        ></ProcessActions>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";

import { stateClassMap } from "@/multivisor";

import ProcessActions from "./Actions.vue";

const props = defineProps({
  processes: { type: Array, required: true },
  supervisors: { type: Array, required: true },
  inspectedUid: { type: String, default: "" },
  selectedUids: { type: Array, required: true },
  labels: { type: Object, required: true },
  nodeName: { type: String, default: undefined },
  showGroup: { type: Boolean, default: true },
  showSupervisor: { type: Boolean, default: undefined },
  dataState: { type: String, default: "ready" },
  hasSourceProcesses: { type: Boolean, default: true },
  hasActiveFilters: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },
  dataReady: { type: Boolean, default: false },
  nodeRunning: { type: Boolean, default: true },
  pendingUids: { type: Array, default: () => [] },
  supervisorsPending: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:selectedUids",
  "inspect",
  "action",
  "clearFilters",
  "update:currentUids",
]);

const breakpoint = useDisplay();
const isNarrow = computed(() => breakpoint.width.value <= 640);

const useSupervisorColumn = computed(
  () => props.showSupervisor ?? props.nodeName === undefined,
);

const headers = computed(() => {
  const columns = [
    {
      align: "start",
      sortable: true,
      title: props.labels.colName,
      value: "name",
    },
  ];
  if (props.showGroup) {
    columns.push({
      align: "start",
      sortable: true,
      title: props.labels.colGroup,
      value: "group",
    });
  }
  if (useSupervisorColumn.value) {
    columns.push({
      align: "start",
      sortable: true,
      title: props.labels.colSupervisor,
      value: "supervisor",
    });
  }
  columns.push(
    {
      align: "start",
      sortable: true,
      title: props.labels.colState,
      value: "statename",
    },
    {
      align: "end",
      sortable: false,
      title: props.labels.colActions,
      value: "actions",
      width: "1%",
    },
  );
  return columns;
});

function stateName(state) {
  return props.labels.stateNames[state] || state;
}

function rowProps({ item }) {
  return {
    class: [
      props.selectedUids.includes(item.uid) ? "row-selected" : "",
      props.inspectedUid === item.uid ? "row-inspected" : "",
      item.statename === "FATAL" ? "row-fatal" : "",
      stateClassMap[item.statename] === "c-attention" ? "row-alert" : "",
    ],
  };
}

function setSelectedUids(uids) {
  emit("update:selectedUids", [...uids]);
}

function toggleProcess(uid, selected) {
  if (!selected) {
    emit(
      "update:selectedUids",
      props.selectedUids.filter((item) => item !== uid),
    );
    return;
  }
  emit("update:selectedUids", [...props.selectedUids, uid]);
}

function inspect(process, panel) {
  emit("inspect", { process, panel });
}

function requestAction(process, action) {
  emit("action", { process, action });
}

function setCurrentUids(items) {
  emit(
    "update:currentUids",
    items.map((item) => item.raw.uid),
  );
}

const actionsEnabled = computed(
  () =>
    props.connected &&
    props.dataReady &&
    props.nodeRunning &&
    !props.pendingUids.length &&
    !props.supervisorsPending,
);

function canControlProcess(process) {
  return (
    actionsEnabled.value &&
    props.supervisors.some(
      (supervisor) =>
        supervisor.name === process.supervisor && supervisor.running,
    )
  );
}

function isPending(process) {
  return props.pendingUids.includes(process.uid);
}
</script>

<style scoped>
@media (max-width: 640px) {
  .mobile-process-meta:empty {
    display: none;
  }
}
</style>
