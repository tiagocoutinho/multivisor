<template>
  <transition name="scale-transition">
    <v-alert v-model="visible" variant="tonal" type="warning" closable>{{
      error
    }}</v-alert>
  </transition>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { error } = storeToRefs(store);

const visible = computed(() => {
  return error.len > 0;
});
</script>
