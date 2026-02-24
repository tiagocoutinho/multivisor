<template>
  <v-snackbar
    :timeout="5000"
    :color="color"
    v-model="visible"
    :text="lastNotification.message"
  >
  </v-snackbar>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { notificationColorMap } from "@/multivisor";

const store = useAppStore();

const { notifications } = storeToRefs(store);

let visible = ref(false);
let color = ref("info");

const lastNotification = computed(() => {
  const n = notifications.value.length;
  const res = n ? notifications.value[n - 1] : { message: "" };
  return res;
});

onMounted(() => {
  watch(lastNotification, (notification) => {
    visible.value = true;
    color.value = notificationColorMap[notification.level];
  });
});
</script>
