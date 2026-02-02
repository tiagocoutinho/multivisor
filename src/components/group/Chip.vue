<template>
  <v-btn variant="flat" router to="/group">
    <v-tooltip activator="parent" location="bottom">Groups</v-tooltip>
    <v-icon class="mr-2">mdi-account-multiple</v-icon>
    {{ nbGroups }}
  </v-btn>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { nbGroups } = storeToRefs(store);
</script>
