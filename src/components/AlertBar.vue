<template>
  <v-alert
    v-if="visible"
    v-model="visible"
    class="ma-4 mb-0"
    variant="tonal"
    :type="initialFailure ? 'error' : 'warning'"
    density="compact"
    :closable="!initialFailure"
  >
    <div class="alert-content">
      <div>
        <strong v-if="initialFailure" class="mr-2">{{ t.loadFailed }}</strong
        ><span>{{ message }}</span>
      </div>
      <v-btn
        v-if="initialFailure"
        size="small"
        variant="tonal"
        @click="store.init()"
        >{{ t.retry }}</v-btn
      >
    </div>
  </v-alert>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { MULTIVISOR_CONNECTION_ERROR, useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());
const dismissed = ref(false);
const initialFailure = computed(
  () => store.dataStatus === "error" && store.lastDataUpdate === null,
);
const disconnected = computed(
  () => !store.connected && store.lastDataUpdate !== null,
);
const message = computed(() => {
  if (store.error && store.error !== MULTIVISOR_CONNECTION_ERROR)
    return store.error;
  return disconnected.value ? t.value.staleData : t.value.connectionFailed;
});
watch(
  [() => store.error, () => store.connected, () => store.dataStatus],
  ([error, connected, status]) => {
    if (error || connected || status === "error") dismissed.value = false;
  },
);
const visible = computed({
  get: () =>
    !dismissed.value &&
    (initialFailure.value || disconnected.value || store.error.length > 0),
  set(show) {
    if (!show) {
      dismissed.value = true;
      store.setError("");
    }
  },
});
</script>

<style scoped>
.alert-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
