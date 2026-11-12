<template>
  <v-footer border height="34" class="text-body-2 px-4 app-footer" app>
    <v-btn
      size="x-small"
      variant="text"
      class="mr-3 px-2"
      @click="$emit('about')"
    >
      <v-icon size="14" class="mr-1">mdi-information-outline</v-icon
      >{{ t.navAbout }}
    </v-btn>
    <span class="connection-status" :aria-label="connectionLabel">
      <v-icon
        size="10"
        :class="store.connected ? 'c-running' : 'c-danger'"
        class="mr-2"
        >mdi-circle</v-icon
      >
      <span class="connection-label">{{ connectionLabel }}</span>
    </span>
    <span class="opacity-60 mx-2" aria-hidden="true">·</span>
    <span class="opacity-70 nums footer-update">{{ updateLabel }}</span>
  </v-footer>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

defineEmits(["about"]);
const store = useAppStore();
const preferences = usePreferencesStore();
const { labels: t } = storeToRefs(preferences);
const connectionLabel = computed(() =>
  store.connected ? t.value.connected : t.value.disconnected,
);
const updateLabel = computed(() => {
  if (store.lastDataUpdate === null) return t.value.notReceivedYet;
  const time = new Date(store.lastDataUpdate).toLocaleTimeString(
    preferences.locale === "zh" ? "zh-CN" : "en-US",
    { hour12: false },
  );
  return t.value.updatedAt(time);
});
</script>

<style scoped>
.app-footer {
  white-space: nowrap;
  min-width: 0;
}
.app-footer .v-btn {
  text-transform: none;
  letter-spacing: 0;
  flex-shrink: 0;
}
.connection-status {
  display: inline-flex;
  align-items: center;
}
.footer-update {
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 640px) {
  .connection-label {
    display: none;
  }
}
</style>
