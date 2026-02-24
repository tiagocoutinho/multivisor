<template>
  <v-app>
    <ToolBar v-model:drawer="drawer"></ToolBar>
    <v-navigation-drawer
      v-model="drawer"
      :location="$vuetify.display.mobile ? 'bottom' : undefined"
      temporary
    >
      <v-list :items="drawerItems"></v-list>
    </v-navigation-drawer>
    <AlertBar></AlertBar>
    <router-view></router-view>
    <NotificationBar></NotificationBar>
    <LogSheet></LogSheet>
    <ProcessDetails></ProcessDetails>
  </v-app>
</template>

<script setup>
import { onMounted } from "vue";

import ToolBar from "@/components/ToolBar";
import NotificationBar from "@/components/NotificationBar";
import AlertBar from "@/components/AlertBar";

import LogSheet from "@/components/process/Log";
import ProcessDetails from "@/components/process/Details";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const drawerItems = [
  {
    title: "Processes",
    value: "process",
  },
  {
    title: "Supervisors",
    value: "Supervisor",
  },
  {
    title: "Groups",
    value: "group",
  },
];

const drawer = ref(false);

onMounted(() => {
  store.init();
});
</script>
