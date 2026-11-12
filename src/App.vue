<template>
  <v-app>
    <div class="bg-blobs" aria-hidden="true"></div>
    <ToolBar @about="aboutVisible = true"></ToolBar>
    <router-view></router-view>
    <Footer v-if="!isLogin" @about="aboutVisible = true"></Footer>
    <NotificationBar></NotificationBar>
    <AboutDialog v-model="aboutVisible"></AboutDialog>
    <ConfirmDialog></ConfirmDialog>
    <ProcessInspector></ProcessInspector>
  </v-app>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocale, useTheme } from "vuetify";

import ToolBar from "@/components/ToolBar";
import Footer from "@/components/Footer";
import AboutDialog from "@/components/AboutDialog";
import NotificationBar from "@/components/NotificationBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProcessInspector from "@/components/process/Inspector";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";
import { useInspectorStore } from "@/stores/inspector";
import { authRedirect, LOGIN_PATH } from "@/router/auth";

const store = useAppStore();
const inspector = useInspectorStore();
const route = useRoute();
const router = useRouter();
const preferences = usePreferencesStore();
const isLogin = computed(() => route.path === LOGIN_PATH);
const aboutVisible = ref(false);
const theme = useTheme();
const { current: vuetifyLocale } = useLocale();

watch(
  () => preferences.themeName,
  (name) => theme.change(name),
  { immediate: true },
);

watch(
  () => preferences.locale,
  (locale) => {
    vuetifyLocale.value = locale === "zh" ? "zhHans" : "en";
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  },
  { immediate: true },
);

watch(
  () => store.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated !== false) {
      return;
    }
    const redirect = authRedirect(
      route.path,
      store.useAuthentication,
      isAuthenticated,
    );
    if (redirect) {
      router.replace(redirect);
    }
  },
);

watch(
  () => route.path,
  () => {
    inspector.close();
    store.clearSelected();
  },
);
let unmounted = false;

onMounted(async () => {
  // 先完成路由认证，避免较晚返回的认证查询覆盖数据接口的 401 状态。
  await router.isReady();
  if (!unmounted) {
    store.init();
  }
});

onUnmounted(() => {
  unmounted = true;
  inspector.close();
  store.disposeDataConnection();
});
</script>
