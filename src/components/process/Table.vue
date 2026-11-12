<template>
  <!-- v2.4：进程视图为信息版卡片网格（桌面/窄屏统一一套，auto-fill 自适应列数）；
       表头排序与分页随数据表格移除，筛选/搜索/批量操作保留在上层工具栏 -->
  <div class="process-grid">
    <template v-if="dataState === 'idle' || dataState === 'loading'">
      <v-skeleton-loader
        v-for="item in 8"
        :key="item"
        type="article"
        class="rounded-lg"
      ></v-skeleton-loader>
    </template>

    <template v-else>
      <article
        v-for="process in processes"
        :key="process.uid"
        class="proc-card"
        :class="procCardClass(process)"
      >
        <div class="proc-card-top">
          <v-checkbox-btn
            :model-value="selectedUids.includes(process.uid)"
            :aria-label="labels.selectProcess(process.name)"
            density="compact"
            color="primary"
            @click.stop
            @update:model-value="toggleProcess(process.uid, $event)"
          ></v-checkbox-btn>
          <button
            type="button"
            class="process-name proc-card-name mono"
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
        <div class="proc-card-meta">
          <template v-if="showGroup">{{ process.group }}</template>
          <template v-if="showGroup && useSupervisorColumn"> · </template>
          <span v-if="useSupervisorColumn" class="mono">{{
            process.supervisor
          }}</span>
        </div>
        <div class="proc-card-stats mono">
          <span v-if="process.pid">PID {{ process.pid }}</span>
          <span v-if="process.statename === 'RUNNING'">
            {{ labels.cardUptime }} {{ formatUptime(process.now - process.start) }}
          </span>
          <span
            v-if="['STOPPED', 'EXITED', 'FATAL', 'BACKOFF'].includes(process.statename)"
          >
            {{ labels.cardExit }} {{ process.exitstatus ?? "—" }}
          </span>
          <span v-if="process.statename === 'UNKNOWN'" class="c-attention">
            {{ labels.offline }}
          </span>
        </div>
        <div class="proc-card-footer">
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
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";

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
]);

const useSupervisorColumn = computed(
  () => props.showSupervisor ?? props.nodeName === undefined,
);

// 卡片运行时长：d/h/m 紧凑单位，中英文通用（mono 数字风格，无需翻译单位）
function formatUptime(seconds) {
  if (!(seconds > 0)) return "0m";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// 卡片语义 class：FATAL / 需关注 tint 在网格扫描中自动浮出；
// 选中品牌 tint + 左边框、正在查看品牌边框（对齐 v2.3 行语义）
function procCardClass(process) {
  return [
    process.statename === "FATAL"
      ? "is-fatal"
      : stateClassMap[process.statename] === "c-attention"
        ? "is-alert"
        : "",
    props.selectedUids.includes(process.uid) ? "row-selected" : "",
    props.inspectedUid === process.uid ? "row-inspected" : "",
  ].filter(Boolean);
}

function stateName(state) {
  return props.labels.stateNames[state] || state;
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
