<template>
  <v-container fluid class="pa-4">
    <ProcessView
      key="processes"
      ref="workbench"
      :title="labels.navProcesses"
      :processes="store.processes"
      scope-key="processes"
      :data-state="store.dataStatus"
      :labels="labels"
    ></ProcessView>
  </v-container>
</template>

<script setup>
import { ref, watch } from "vue";

import ProcessView from "@/components/process/View.vue";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

definePage({
  name: "processes",
});

const store = useAppStore();
const preferences = usePreferencesStore();
const { labels } = storeToRefs(preferences);

const route = useRoute();

const workbench = ref(null);

watch(
  [
    computed(() => ({
      quick: route.query.quick,
      state: route.query.state,
      node: route.query.node,
    })),
    workbench,
  ],
  ([filters]) => {
    workbench.value?.applyFilters(filters);
  },
  { immediate: true },
);
</script>
