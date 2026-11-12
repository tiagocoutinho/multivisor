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
    <router-view></router-view>
    <NotificationBar></NotificationBar>
    <LogSheet></LogSheet>
    <ProcessDetails></ProcessDetails>
  </v-app>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useLocale, useTheme } from "vuetify";

import ToolBar from "@/components/ToolBar";
import NotificationBar from "@/components/NotificationBar";

import LogSheet from "@/components/process/Log";
import ProcessDetails from "@/components/process/Details";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const version = __APP_VERSION__;

const store = useAppStore();
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

onMounted(() => {
  store.init();
});
</script>
