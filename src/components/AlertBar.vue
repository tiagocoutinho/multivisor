<template>
  <transition name="scale-transition">
    <v-alert v-model="visible" variant="tonal" type="warning" closable>{{
      message
    }}</v-alert>
  </transition>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { MULTIVISOR_CONNECTION_ERROR, useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { error } = storeToRefs(store);

const message = computed(() =>
  error.value === MULTIVISOR_CONNECTION_ERROR
    ? t.value.connectionFailed
    : error.value,
);

const visible = computed({
  get: () => error.value.length > 0,
  set(show) {
    if (!show) {
      store.setError("");
    }
  },
});
</script>
