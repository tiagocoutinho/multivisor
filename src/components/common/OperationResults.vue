<template>
  <section
    v-if="operationResults.length"
    class="operation-result mx-4 mb-4"
    :aria-label="labels.operationResults"
    aria-live="polite"
  >
    <div class="operation-result-header">
      <span class="font-weight-medium">{{ labels.operationResults }}</span>
      <v-btn
        size="small"
        variant="text"
        :aria-label="labels.dismissResults"
        :disabled="store.confirming"
        @click="store.operationResults = []"
      >
        {{ labels.close }}
      </v-btn>
    </div>
    <div
      v-for="result in operationResults"
      :key="`${result.kind}:${result.action}:${result.uid || result.name}`"
      class="operation-result-item"
    >
      <span class="mono">{{ result.name }}</span>
      <span v-if="result.kind === 'process'" class="opacity-70 mono">{{
        result.supervisor
      }}</span>
      <span class="opacity-70">{{ actionText(result) }}</span>
      <span v-if="result.httpStatus !== undefined" class="mono text-caption"
        >HTTP {{ result.httpStatus }}</span
      >
      <span class="operation-result-status" :class="resultClass(result)">
        {{ statusText(result) }}
      </span>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels } = storeToRefs(usePreferencesStore());

const operationResults = computed(() => store.operationResults);

function actionText(result) {
  if (result.kind === "supervisor") {
    return result.action === "update"
      ? labels.value.update
      : labels.value.restartNode;
  }
  return labels.value[result.action];
}

function resultClass(result) {
  if (result.requestState === "accepted") {
    return "c-running";
  }
  if (result.requestState === "failed") {
    return "c-danger";
  }
  return "c-info";
}

function statusText(result) {
  if (result.requestState === "sending") {
    return labels.value.operationSending;
  }
  if (result.requestState === "accepted") {
    return labels.value.operationDone(result.action);
  }
  if (result.requestState === "failed") {
    return labels.value.operationFailed;
  }
  return labels.value.operationNotSubmitted;
}
</script>

<style scoped>
.operation-result {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid var(--mv-table-border);
  border-radius: 8px;
  background: var(--mv-table-bg);
  font-size: 13px;
}

.operation-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.operation-result-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 8px 0;
  border-top: 1px solid var(--mv-table-border);
}

.operation-result-item:first-of-type {
  margin-top: 8px;
  border-top: none;
}

.operation-result-item .mono {
  overflow-wrap: anywhere;
}

.operation-result-status {
  margin-left: auto;
}
</style>
