<template lang="html">
  <v-chip
    label
    variant="flat"
    :color="stateColorMap[state]"
    text-color="white"
    :small="small"
  >
    {{ t.stateNames[state] }}
  </v-chip>
</template>

<script setup>
import { stateColorMap } from "@/multivisor";
import { usePreferencesStore } from "@/stores/preferences";

const { labels: t } = storeToRefs(usePreferencesStore());

//const props = defineProps(['state', 'small'])

const { state, small } = defineProps({
  state: { default: "UNKNOWN" },
  small: { default: false },
});
</script>
