<template>
  <v-dialog
    :model-value="!!confirmation"
    :persistent="confirming"
    max-width="560"
    @update:model-value="!$event && store.cancelConfirmation()"
  >
    <v-card v-if="confirmation" style="max-height: calc(100dvh - 48px)">
      <v-card-item>
        <template #prepend>
          <v-icon
            :class="confirmation.action === 'stop' ? 'c-danger' : 'c-info'"
            size="24"
          >
            {{ actionIcon }}
          </v-icon>
        </template>
        <v-card-title class="font-weight-medium">{{ title }}</v-card-title>
      </v-card-item>
      <v-divider></v-divider>
      <v-card-text
        v-if="confirmation.kind === 'process'"
        class="overflow-y-auto"
      >
        <div class="confirm-scope-note">
          {{
            labels.confirmSelectionScope(
              confirmGroups.length,
              confirmation.uids.length,
            )
          }}
        </div>
        <div class="text-body-2 opacity-70 mb-2">{{ labels.confirmScope }}</div>
        <div
          v-for="group in confirmGroups"
          :key="group.supervisor"
          class="mb-2"
        >
          <div class="text-body-2 font-weight-medium mono">
            {{ group.supervisor }}
          </div>
          <div class="text-body-2 opacity-80 mono ml-4 confirm-process-names">
            <div v-for="process in group.processes" :key="process.uid">
              {{ process.name }}
              <span class="c-neutral">· {{ process.uid }}</span>
            </div>
          </div>
        </div>
        <div v-if="unavailable && !confirming" class="text-body-2 c-attention">
          {{ labels.selectionUnavailable }}
        </div>
      </v-card-text>
      <v-card-text v-else class="text-body-2 opacity-80">
        {{ nodeDescription }}
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          :disabled="confirming"
          @click="store.cancelConfirmation()"
        >
          {{ labels.cancel }}
        </v-btn>
        <v-btn
          :color="confirmation.action === 'stop' ? 'error' : 'primary'"
          variant="flat"
          :loading="confirming"
          :disabled="unavailable || confirming"
          @click="store.confirmOperation()"
        >
          {{ actionLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels } = storeToRefs(usePreferencesStore());

const confirmation = computed(() => store.confirmation);
const confirming = computed(() => store.confirming);
const unavailable = computed(() => store.confirmationUnavailable);

const confirmGroups = computed(() => {
  if (confirmation.value?.kind !== "process") {
    return [];
  }
  const bySupervisor = new Map();
  for (const uid of confirmation.value.uids) {
    const process = store.process(uid);
    if (!process) {
      continue;
    }
    const supervisor = process.supervisor;
    if (!bySupervisor.has(supervisor)) {
      bySupervisor.set(supervisor, { supervisor, processes: [] });
    }
    bySupervisor.get(supervisor).processes.push(process);
  }
  return [...bySupervisor.values()];
});

const title = computed(() => {
  const current = confirmation.value;
  if (!current) {
    return "";
  }
  if (current.kind === "supervisor") {
    return current.action === "update"
      ? labels.value.update
      : labels.value.confirmNodeRestartTitle;
  }
  const count = current.uids.length;
  if (current.action === "start") {
    return labels.value.confirmStartTitle(count);
  }
  if (current.action === "stop") {
    return labels.value.confirmStopTitle(count);
  }
  return labels.value.confirmRestartTitle(count);
});

const actionLabel = computed(() => {
  const current = confirmation.value;
  if (!current) {
    return "";
  }
  if (current.kind === "supervisor") {
    return current.action === "update"
      ? labels.value.update
      : labels.value.confirmNodeRestart;
  }
  const count = current.uids.length;
  if (current.action === "start") {
    return labels.value.confirmStartN(count);
  }
  if (current.action === "stop") {
    return labels.value.confirmStopN(count);
  }
  return labels.value.confirmRestartN(count);
});

const actionIcon = computed(() => {
  const current = confirmation.value;
  if (!current) {
    return "mdi-information-outline";
  }
  if (current.kind === "supervisor") {
    return "mdi-server";
  }
  if (current.action === "stop") {
    return "mdi-stop-circle-outline";
  }
  if (current.action === "restart") {
    return "mdi-autorenew";
  }
  return "mdi-play-circle-outline";
});

const nodeDescription = computed(() => {
  const current = confirmation.value;
  if (current?.kind !== "supervisor") {
    return "";
  }
  if (current.action === "update") {
    return labels.value.confirmNodeUpdateDesc(current.name);
  }
  return labels.value.confirmNodeRestartDesc(current.name);
});
</script>

<style scoped>
.confirm-scope-note {
  background: var(--mv-sel-bg);
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
}

.confirm-process-names {
  overflow-wrap: anywhere;
  line-height: 1.8;
}
</style>
