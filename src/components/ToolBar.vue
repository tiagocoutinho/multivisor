<template>
  <v-app-bar blue :elevation="2" class="bg-primary">
    <!-- <template v-slot:prepend>
      <v-menu offset="15" v-show="isAuthenticated && useAuthentication">
        <template slot="activator">
          <v-btn icon slot="activator">
            <v-icon >menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template> -->

    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

    <v-app-bar-title style="cursor: pointer" @click="$router.push('/')">
      {{ name }}
    </v-app-bar-title>

    <v-text-field
      prepend-inner-icon="mdi-magnify"
      density="compact"
      clearable
      single-line
      hide-details
      placeholder="Filter"
      v-model="search"
      class="expending-search"
      :class="{ closed: searchClosed && !search }"
      v-show="isAuthenticated || !useAuthentication"
      @focus="searchClosed = false"
      @blur="searchClosed = true"
    >
    </v-text-field>

    <template v-slot:append>
      <!-- <ActionBar v-show="isAuthenticated || !useAuthentication"></ActionBar> -->
      <!-- <v-toolbar-items v-show="isAuthenticated || !useAuthentication"> -->
      <!-- <v-btn icon="mdi-dots-vertical"></v-btn> -->
      <v-btn-group variant="outlined" divided class="buttons-padding">
        <ProcessChip class="hidden-sm-and-down"></ProcessChip>
        <SupervisorChip class="hidden-sm-and-down"></SupervisorChip>
        <GroupChip class="hidden-sm-and-down"></GroupChip>
      </v-btn-group>
      <!-- </v-toolbar-items> -->
    </template>
  </v-app-bar>
</template>

<script setup>
//import { computed } from 'vue'
import { storeToRefs } from "pinia";

import ProcessChip from "./process/Chip.vue";
import SupervisorChip from "./supervisor/Chip.vue";
import GroupChip from "./group/Chip.vue";
import ActionBar from "./ActionBar.vue";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { name, search, isAuthenticated, useAuthentication } = storeToRefs(store);

const drawer = defineModel("drawer", false);

const searchClosed = ref(true);

function logout() {
  dispatch("logout").then(() => {
    this.$router.push({ name: "Login" });
  });
}
</script>

<style scoped lang="sass">
.v-input.expending-search
  transition: max-width 0.3s
  .v-field__prepend-inner
    cursor: pointer !important
  &.closed
    max-width: 45px
    .v-field__overlay
      background-color: transparent !important

.buttons-padding
  padding-left: 1em
  padding-right: 1em
</style>
