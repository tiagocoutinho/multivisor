<template>
  <!-- 操作结果反馈：右下角轻量 snackbar（替代页面内全宽面板）。
       提交进行中不倒计时；全部结算后自动关闭——全成功约 6s，
       有失败 10s 并列出失败项；点击"关闭"立即清除。 -->
  <v-snackbar
    :model-value="visible"
    location="bottom right"
    :offset="46"
    :timeout="-1"
    :color="snackbarColor"
    @update:model-value="onToggle"
  >
    <div class="op-snackbar-body">
      <div class="op-summary">{{ summaryText }}</div>
      <div v-if="failureResults.length" class="op-failures" role="list">
        <div
          v-for="result in failureResults"
          :key="`${result.kind}:${result.action}:${result.uid || result.name}`"
          class="op-failure-item mono"
          role="listitem"
        >
          {{ result.name }}
          <span class="opacity-70">{{ actionText(result) }}</span>
        </div>
      </div>
    </div>
    <template #actions>
      <v-btn
        variant="text"
        :disabled="store.confirming"
        @click="dismiss"
      >
        {{ labels.close }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from "vue";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

// 全成功 / 有失败两种停留时长（毫秒）
const AUTO_CLOSE_OK_MS = 6000;
const AUTO_CLOSE_FAIL_MS = 10000;

const store = useAppStore();
const { labels } = storeToRefs(usePreferencesStore());

const visible = ref(false);
let closeTimer = null;

const failureResults = computed(() =>
  store.operationResults.filter(
    (result) => result.requestState === "failed",
  ),
);
const acceptedCount = computed(
  () =>
    store.operationResults.filter(
      (result) => result.requestState === "accepted",
    ).length,
);

const summaryText = computed(() =>
  failureResults.value.length
    ? labels.value.operationSummary(
        acceptedCount.value,
        failureResults.value.length,
      )
    : labels.value.operationSummaryDone(store.operationResults.length),
);

const snackbarColor = computed(() =>
  failureResults.value.length ? "error" : undefined,
);

watch(
  () => store.operationResults,
  (results) => {
    clearTimeout(closeTimer);
    if (!results.length) {
      visible.value = false;
      return;
    }
    visible.value = true;
    // 渐进结算期间（sending → accepted/failed）不倒计时，全部结算后才开始
    if (results.some((result) => result.requestState === "sending")) {
      return;
    }
    closeTimer = setTimeout(
      dismiss,
      failureResults.value.length ? AUTO_CLOSE_FAIL_MS : AUTO_CLOSE_OK_MS,
    );
  },
  { deep: true },
);

onUnmounted(() => clearTimeout(closeTimer));

function onToggle(value) {
  if (value) {
    visible.value = true;
    return;
  }
  dismiss();
}

function dismiss() {
  clearTimeout(closeTimer);
  visible.value = false;
  // confirming 期间结果仍在渐进更新，不能清（与原面板关闭按钮的禁用语义一致）
  if (!store.confirming) {
    store.operationResults = [];
  }
}

function actionText(result) {
  if (result.kind === "supervisor") {
    return result.action === "update"
      ? labels.value.update
      : labels.value.restartNode;
  }
  return labels.value[result.action];
}
</script>

<style scoped>
.op-snackbar-body {
  max-width: 420px;
}
.op-summary {
  font-size: 13px;
}
.op-failures {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  max-height: 30vh;
  overflow-y: auto;
  font-size: 12px;
}
</style>
