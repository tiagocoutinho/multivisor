<template>
  <section
    v-if="visible"
    ref="panelElement"
    class="inspector-panel"
    :style="{ height: `${height}px` }"
    role="region"
    :aria-label="labels.workspace"
    tabindex="-1"
  >
    <div
      class="inspector-resize"
      role="separator"
      tabindex="0"
      aria-orientation="horizontal"
      :aria-label="labels.resizeWorkspace"
      :aria-valuenow="height"
      :aria-valuemin="minHeight"
      :aria-valuemax="maxHeight"
      @keydown.down.prevent="setHeight(height - 32)"
      @keydown.up.prevent="setHeight(height + 32)"
      @lostpointercapture="stopResize"
      @pointercancel="stopResize"
      @pointerdown="startResize"
      @pointermove="resize"
      @pointerup="stopResize"
    ></div>

    <div class="inspector-header">
      <div class="inspector-identity">
        <div class="inspector-title mono">
          {{ currentProcess?.name || uid }}
        </div>
        <div class="inspector-subtitle">
          <template v-if="currentProcess">
            <span class="mono">{{ currentProcess.supervisor }}</span>
            · {{ currentProcess.group }}
          </template>
          <template v-else>{{ labels.processUnavailable }}</template>
          <span v-if="!isCurrentOrdered"> · {{ labels.outsideResults }} </span>
        </div>
      </div>

      <v-chip
        v-if="currentProcess"
        :class="['st-chip', stateClassMap[currentProcess.statename]]"
        label
        size="small"
        variant="tonal"
      >
        {{ stateName(currentProcess.statename) }}
      </v-chip>
      <v-chip
        v-else
        class="st-chip c-neutral"
        label
        size="small"
        variant="tonal"
      >
        {{ labels.processUnavailable }}
      </v-chip>

      <div class="inspector-navigation">
        <v-btn
          :aria-label="labels.previousProcess"
          :disabled="!currentProcess || !canStep(-1)"
          icon
          size="small"
          variant="text"
          @click="inspector.step(-1)"
        >
          <v-icon size="18">mdi-chevron-left</v-icon>
        </v-btn>
        <v-btn
          :aria-label="labels.nextProcess"
          :disabled="!currentProcess || !canStep(1)"
          icon
          size="small"
          variant="text"
          @click="inspector.step(1)"
        >
          <v-icon size="18">mdi-chevron-right</v-icon>
        </v-btn>
        <v-btn
          :aria-label="height >= maxHeight ? labels.collapse : labels.expand"
          icon
          size="small"
          variant="text"
          @click="toggleSize"
        >
          <v-icon size="18">
            {{
              height >= maxHeight
                ? "mdi-arrow-collapse-vertical"
                : "mdi-arrow-expand-vertical"
            }}
          </v-icon>
        </v-btn>
        <v-btn
          :aria-label="labels.closeWorkspace"
          icon
          size="small"
          variant="text"
          @click="inspector.close()"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>

    <v-tabs
      v-model="tab"
      class="inspector-tabs"
      color="primary"
      density="compact"
    >
      <v-tab value="details">{{ labels.info }}</v-tab>
      <v-tab :disabled="!currentProcess?.logfile" value="out">
        {{ labels.logTypeOut }}
      </v-tab>
      <v-tab :disabled="!currentProcess?.stderr_logfile" value="err">
        {{ labels.logTypeErr }}
      </v-tab>
    </v-tabs>

    <div v-if="tab === 'details'" class="inspector-content">
      <ProcessDetails
        :labels="labels"
        :locale="locale"
        :process="currentProcess"
      ></ProcessDetails>
    </div>
    <ProcessLog
      v-else
      :active="logActive"
      :labels="labels"
      :stream="tab"
      :uid="uid"
    ></ProcessLog>
  </section>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { storeToRefs } from "pinia";

import { stateClassMap } from "@/multivisor";
import ProcessDetails from "./Details.vue";
import ProcessLog from "./Log.vue";
import { useAppStore } from "@/stores/app";
import { useInspectorStore } from "@/stores/inspector";
import { usePreferencesStore } from "@/stores/preferences";

const appStore = useAppStore();
const inspector = useInspectorStore();
const { labels, locale } = storeToRefs(usePreferencesStore());
const { height, orderedUids, tab, uid, visible } = storeToRefs(inspector);

const currentProcess = computed(() => appStore.process(uid.value));
const isCurrentOrdered = computed(() => orderedUids.value.includes(uid.value));
const logActive = computed(() => {
  if (
    !visible.value ||
    (tab.value !== "out" && tab.value !== "err") ||
    !currentProcess.value
  ) {
    return false;
  }
  return tab.value === "out"
    ? Boolean(currentProcess.value.logfile)
    : Boolean(currentProcess.value.stderr_logfile);
});

const panelElement = useTemplateRef("panelElement");
const maxHeight = ref(600);
const minHeight = ref(240);
let focusReturnTarget = null;
let resizeOrigin = null;

function stateName(state) {
  return labels.value.stateNames[state] || state;
}

function setHeight(nextHeight) {
  height.value = Math.min(
    maxHeight.value,
    Math.max(minHeight.value, nextHeight),
  );
}

function toggleSize() {
  setHeight(height.value >= maxHeight.value ? 360 : maxHeight.value);
}

function startResize(event) {
  if (event.button !== 0) {
    return;
  }
  resizeOrigin = { height: height.value, y: event.clientY };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function resize(event) {
  if (!resizeOrigin) {
    return;
  }
  setHeight(resizeOrigin.height + resizeOrigin.y - event.clientY);
}

function stopResize() {
  resizeOrigin = null;
}

function canStep(offset) {
  const index = orderedUids.value.indexOf(uid.value);
  return (
    index !== -1 &&
    index + offset >= 0 &&
    index + offset < orderedUids.value.length
  );
}

function hasActiveOverlay() {
  return Boolean(
    document.querySelector(
      ".v-dialog.v-overlay--active, .v-menu.v-overlay--active",
    ),
  );
}

function handleGlobalKeydown(event) {
  if (event.key !== "Escape" || event.isComposing || !visible.value) {
    return;
  }
  if (hasActiveOverlay()) {
    return;
  }
  inspector.close();
}

function isInteractiveTarget(target) {
  return Boolean(
    target?.closest?.(
      ".v-overlay, button, a, input, select, textarea, label, th, [role='button'], [role='tab'], [role='checkbox'], [role='combobox']",
    ),
  );
}

function handleGlobalClick(event) {
  if (!visible.value || !(event.target instanceof Element)) {
    return;
  }
  if (
    panelElement.value?.contains(event.target) ||
    isInteractiveTarget(event.target)
  ) {
    return;
  }
  if (hasActiveOverlay()) {
    return;
  }
  inspector.close();
}

function updateViewportHeight() {
  const viewportHeight = window.innerHeight;
  maxHeight.value = Math.max(180, viewportHeight - 150);
  minHeight.value = Math.min(240, maxHeight.value);
  setHeight(height.value);
}

function restoreFocus() {
  nextTick(() => {
    const target = focusReturnTarget;
    focusReturnTarget = null;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  });
}

watch(visible, (nextVisible, previousVisible) => {
  if (nextVisible && !previousVisible) {
    focusReturnTarget = document.activeElement;
    nextTick(() => {
      panelElement.value?.focus({ preventScroll: true });
    });
  }
  if (!nextVisible && previousVisible) {
    stopResize();
    restoreFocus();
  }
});

onMounted(() => {
  updateViewportHeight();
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("keydown", handleGlobalKeydown, true);
  window.addEventListener("resize", updateViewportHeight);
});

onBeforeUnmount(() => {
  stopResize();
  document.removeEventListener("click", handleGlobalClick);
  document.removeEventListener("keydown", handleGlobalKeydown, true);
  window.removeEventListener("resize", updateViewportHeight);
});
</script>

<style scoped></style>
