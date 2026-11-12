<template>
  <v-card
    class="node-card d-flex flex-column"
    variant="outlined"
    role="link"
    tabindex="0"
    :aria-label="supervisor.name + ' · ' + t.enterDetail"
    @click="openNode()"
    @keydown.enter.self="openNode()"
  >
    <v-card-item>
      <v-card-title>{{ supervisor.name }}</v-card-title>
      <template #append>
        <span
          class="node-connection"
          :class="supervisor.running ? 'c-running' : 'c-attention'"
        >
          <v-icon size="8">mdi-circle</v-icon
          >{{ supervisor.running ? t.online : t.offline }}
        </span>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              size="small"
              variant="text"
              class="ml-1"
              :aria-label="t.nodeMenu + ' ' + supervisor.name"
              @click.stop
              ><v-icon size="18">mdi-dots-vertical</v-icon></v-btn
            >
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-update"
              :title="t.update"
              :disabled="!canOperate"
              @click="store.requestSupervisorAction(supervisor.name, 'update')"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-restart"
              :title="t.restartNode"
              :disabled="!canOperate"
              @click="store.requestSupervisorAction(supervisor.name, 'restart')"
            ></v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-card-item>
    <v-card-text>
      <div class="node-health">
        <div v-if="supervisor.running">
          <span class="node-health-count nums"
            >{{ runningCount
            }}<span class="text-body-2 c-neutral">
              / {{ processes.length }}</span
            ></span
          >
          <span class="node-health-label">{{ t.runningShort }}</span>
        </div>
        <span v-else class="text-body-2 c-attention">{{
          t.nodeUnreachable
        }}</span>
        <v-btn
          v-if="alertCount"
          size="small"
          variant="tonal"
          :class="hasFatal ? 'c-danger' : 'c-attention'"
          @click.stop="openNode({ quick: 'alerts' })"
        >
          {{ t.alertCount(alertCount)
          }}<v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
        </v-btn>
        <span
          v-else-if="supervisor.running"
          class="text-caption c-running ml-auto"
          >{{ t.noAlerts }}</span
        >
      </div>
      <div v-if="supervisor.url" class="node-address mono">
        {{ supervisor.url }}
      </div>
      <div class="node-card-footer">
        <span v-if="!supervisor.running" class="mono">{{
          t.lastKnownData
        }}</span>
        <span v-else class="mono">
          <template v-if="supervisor.supervisor_version"
            >Supervisor {{ supervisor.supervisor_version }}</template
          >
          <template
            v-if="supervisor.supervisor_version && supervisor.pid !== undefined"
          >
            ·
          </template>
          <template v-if="supervisor.pid !== undefined"
            >PID {{ supervisor.pid }}</template
          >
        </span>
        <span
          >{{ t.enterDetail }}
          <v-icon size="14">mdi-chevron-right</v-icon></span
        >
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { countAlertProcesses, countRunningProcesses } from "@/multivisor";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const props = defineProps({ supervisor: { type: Object, required: true } });
const store = useAppStore();
const router = useRouter();
const { labels: t } = storeToRefs(usePreferencesStore());
const processes = computed(() => Object.values(props.supervisor.processes));
const runningCount = computed(() => countRunningProcesses(processes.value));
const alertCount = computed(() => countAlertProcesses(processes.value));
const hasFatal = computed(() =>
  processes.value.some((process) => process.statename === "FATAL"),
);
const canOperate = computed(
  () =>
    store.connected &&
    store.dataStatus === "ready" &&
    props.supervisor.running &&
    !store.pendingSupervisorNames.length &&
    !store.pendingProcessUids.length,
);
function openNode(query = {}) {
  router.push({
    name: "supervisor-detail",
    params: { name: props.supervisor.name },
    query,
  });
}
</script>

<style scoped>
.node-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
</style>
