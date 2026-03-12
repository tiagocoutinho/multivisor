<template>
  <v-app>
    <ToolBar v-model:drawer="drawer"></ToolBar>
    <v-navigation-drawer expand-on-hover permanent rail>
      <v-list>
        <v-list-item
          prepend-avatar="@/assets/multivisor.png"
          subtitle="v7.0.0"
          title="Multivisor"
          router
          to="/about"
        ></v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-list :items="drawerItems" density="compact" nav>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Processes"
          value="processes"
          router
          to="/process"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Groups"
          value="groups"
          router
          to="/group"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-desktop-classic"
          title="Supervisors"
          value="supervisors"
          router
          to="/supervisor"
        ></v-list-item>
      </v-list>
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
