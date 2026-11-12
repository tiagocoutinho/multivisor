<template>
  <v-main
    :class="{ 'has-inspector': inspector.visible && !isLogin }"
    :style="
      inspector.visible && !isLogin
        ? { '--inspector-height': `${inspector.height}px` }
        : {}
    "
  >
    <AlertBar v-if="!isLogin"></AlertBar>
    <router-view
      v-if="
        isLogin || store.dataStatus !== 'error' || store.lastDataUpdate !== null
      "
    ></router-view>
    <OperationResults v-if="!isLogin"></OperationResults>
  </v-main>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AlertBar from "@/components/AlertBar";
import OperationResults from "@/components/common/OperationResults";
import { useAppStore } from "@/stores/app";
import { useInspectorStore } from "@/stores/inspector";
import { LOGIN_PATH } from "@/router/auth";

const store = useAppStore();
const inspector = useInspectorStore();
const route = useRoute();
const isLogin = computed(() => route.path === LOGIN_PATH);
</script>
