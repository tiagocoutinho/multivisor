<template>
  <div class="inspector-log-toolbar">
    <v-text-field
      v-model="logSearch"
      class="inspector-log-search"
      clearable
      density="compact"
      :disabled="!active"
      hide-details
      :label="labels.searchLogs"
      prepend-inner-icon="mdi-magnify"
      single-line
      variant="outlined"
    ></v-text-field>
    <v-switch
      v-model="autoScroll"
      color="primary"
      density="compact"
      :disabled="!active"
      hide-details
      :label="labels.autoScroll"
    ></v-switch>
    <span class="inspector-log-meta nums">
      {{ labels.logSize }} {{ localSizeText }} · {{ labels.remoteLogSize }}
      {{ remoteSizeText }} · {{ visibleLogLines.length }} {{ labels.logLines }}
    </span>
    <v-spacer></v-spacer>
    <v-btn
      :disabled="!active || !visibleLogLines.length"
      prepend-icon="mdi-content-copy"
      size="small"
      variant="text"
      @click="copyVisibleLog"
    >
      {{ labels.copy }}
    </v-btn>
    <v-btn
      :disabled="!active || (!cleared && !visibleLogLines.length)"
      prepend-icon="mdi-delete-outline"
      size="small"
      variant="text"
      @click="clearDisplayedLog"
    >
      {{ labels.clearDisplay }}
    </v-btn>
  </div>

  <div
    ref="logPaneElement"
    :aria-label="stream === 'err' ? labels.logErr : labels.logOut"
    class="inspector-log-pane"
  >
    <div v-if="copyMessage" class="inspector-log-error" role="status">
      {{ copyMessage }}
    </div>
    <div
      v-if="logErrorMessage"
      class="c-danger inspector-log-error"
      role="alert"
    >
      {{ logErrorMessage }}
    </div>
    <pre v-if="visibleLogLines.length">{{ visibleLogLines.join("\n") }}</pre>
    <div v-else class="inspector-log-empty">{{ emptyMessage }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

import { formatBytes } from "@/multivisor";
import { useProcessLog } from "@/composables/useProcessLog";

const props = defineProps({
  active: { type: Boolean, default: false },
  labels: { type: Object, required: true },
  stream: {
    type: String,
    default: "out",
    validator: (value) => value === "out" || value === "err",
  },
  uid: { type: String, default: "" },
});

const uid = computed(() => props.uid);
const stream = computed(() => props.stream);
const active = computed(() => props.active);
const {
  text: logText,
  remoteSize,
  localSize,
  error: logError,
  autoScroll,
  clearDisplay,
} = useProcessLog({ uid, stream, active });

const logPaneElement = useTemplateRef("logPaneElement");
const logSearch = ref("");
const cleared = ref(false);
const copyState = ref("");

const visibleLogLines = computed(() => {
  const query = (logSearch.value || "").trim().toLowerCase();
  if (!logText.value) {
    return [];
  }
  const lines = logText.value.split("\n");
  if (!query) {
    return lines;
  }
  return lines.filter((line) => line.toLowerCase().includes(query));
});

const localSizeText = computed(() => formatBytes(localSize.value));
const remoteSizeText = computed(() => formatBytes(remoteSize.value));
const copyMessage = computed(() => {
  if (copyState.value === "success") {
    return props.labels.copied;
  }
  if (copyState.value === "failed") {
    return props.labels.copyFailed;
  }
  return "";
});
const logErrorMessage = computed(() => {
  if (logError.value === "invalid-log-message") {
    return props.labels.invalidLogMessage;
  }
  if (logError.value === "log-stream-failed") {
    return props.labels.logStreamFailed;
  }
  return "";
});
const emptyMessage = computed(() => {
  if (logSearch.value) {
    return props.labels.noMatchingLogs;
  }
  return cleared.value ? props.labels.logCleared : props.labels.notReceivedYet;
});

async function copyVisibleLog() {
  if (!navigator.clipboard) {
    copyState.value = "failed";
    return;
  }
  try {
    await navigator.clipboard.writeText(visibleLogLines.value.join("\n"));
    copyState.value = "success";
  } catch {
    copyState.value = "failed";
  }
}

function clearDisplayedLog() {
  clearDisplay();
  cleared.value = true;
  copyState.value = "";
}

watch(
  [uid, stream, active],
  () => {
    cleared.value = false;
    copyState.value = "";
  },
  { flush: "sync" },
);

watch(logText, (text) => {
  if (text) {
    cleared.value = false;
  }
});

watch(
  [logText, logSearch, autoScroll, active],
  () => {
    if (!autoScroll.value) {
      return;
    }
    nextTick(() => {
      const pane = logPaneElement.value;
      if (pane) {
        pane.scrollTop = pane.scrollHeight;
      }
    });
  },
  { flush: "post" },
);
</script>

<style scoped>
.inspector-log-error {
  font-size: 12px;
  padding: 4px 0 8px;
}
</style>
