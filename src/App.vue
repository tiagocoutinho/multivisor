<template>
  <v-app>
    <div class="bg-blobs" aria-hidden="true"></div>
    <ToolBar v-model:drawer="drawer"></ToolBar>
    <v-navigation-drawer expand-on-hover permanent rail>
      <v-list>
        <v-list-item
          prepend-avatar="@/assets/multivisor.png"
          :subtitle="`v${version}`"
          title="Multivisor"
          router
          to="/about"
        ></v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-list :items="drawerItems" density="compact" nav>
        <v-list-item
          prepend-icon="mdi-cog"
          :title="t.navProcesses"
          value="processes"
          router
          to="/process"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="t.navGroups"
          value="groups"
          router
          to="/group"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-desktop-classic"
          :title="t.navNodes"
          value="supervisors"
          router
          to="/supervisor"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>
    <router-view
      v-if="route.path === LOGIN_PATH || store.dataStatus === 'ready'"
    ></router-view>
    <v-main v-else class="d-flex align-center justify-center">
      <div
        v-if="store.dataStatus === 'error'"
        class="text-center pa-6"
        role="alert"
      >
        <h2 class="text-h6 mb-2">{{ t.loadFailed }}</h2>
        <p class="mb-4">{{ t.connectionFailed }}</p>
        <v-btn color="primary" @click="store.init()">{{ t.retry }}</v-btn>
      </div>
      <v-progress-circular
        v-else
        color="primary"
        indeterminate
        role="status"
        :aria-label="t.refresh"
      ></v-progress-circular>
    </v-main>
    <NotificationBar></NotificationBar>
    <LogSheet></LogSheet>
    <ProcessDetails></ProcessDetails>
  </v-app>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useLocale, useTheme } from "vuetify";

import ToolBar from "@/components/ToolBar";
import NotificationBar from "@/components/NotificationBar";

import LogSheet from "@/components/process/Log";
import ProcessDetails from "@/components/process/Details";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";
import { authRedirect, LOGIN_PATH } from "@/router/auth";

const version = __APP_VERSION__;

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const preferences = usePreferencesStore();
const { labels: t } = storeToRefs(preferences);
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

const drawerItems = computed(() => [
  {
    title: t.value.navProcesses,
    value: "process",
  },
  {
    title: t.value.navNodes,
    value: "Supervisor",
  },
  {
    title: t.value.navGroups,
    value: "group",
  },
]);

const drawer = ref(false);
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
  store.disposeDataConnection();
});
</script>
