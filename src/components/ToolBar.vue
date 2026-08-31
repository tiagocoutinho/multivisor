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

    <!-- <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon> -->

    <v-app-bar-title style="cursor: pointer" @click="$router.push('/')">
      {{ name }}
    </v-app-bar-title>

    <template v-slot:append>
      <v-fade-transition>
        <v-btn
          v-show="!showSearch"
          icon
          @click="showSearch = true"
        >
            <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </v-fade-transition>

      <v-expand-x-transition>
        <v-text-field
          v-if="showSearch"
          v-model.trim="search"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          label="Filter..."
          variant="solo"
          hide-details
          single-line
          clearable
          autofocus
          @keydown.esc="showSearch = false"
          @click:clear="showSearch = false"
          @blur="search && search.length ? showSearch : showSearch = false"
          class="search-input"
        ></v-text-field>
      </v-expand-x-transition>
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

const showSearch = ref(false);

function logout() {
  dispatch("logout").then(() => {
    this.$router.push({ name: "Login" });
  });
}
</script>

<style>
.v-input__control {
  min-width: 400px;
}
</style>