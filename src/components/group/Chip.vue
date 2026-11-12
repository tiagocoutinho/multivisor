<template>
  <v-btn variant="flat" router to="/group" :aria-label="t.navGroups">
    <v-tooltip activator="parent" location="bottom">{{
      t.navGroups
    }}</v-tooltip>
    <v-icon class="mr-2">mdi-account-multiple</v-icon>
    {{ nbGroups }}
  </v-btn>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { nbGroups } = storeToRefs(store);
</script>
