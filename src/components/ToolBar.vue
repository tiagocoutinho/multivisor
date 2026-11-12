<template>
  <v-app-bar :elevation="2">
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
          :aria-label="t.openSearch"
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
          :label="t.searchPh"
          variant="solo"
          hide-details
          single-line
          clearable
          autofocus
          @keydown.esc="
            search = '';
            showSearch = false;
          "
          @click:clear="showSearch = false"
          @blur="search && search.length ? showSearch : (showSearch = false)"
          class="search-input"
        ></v-text-field>
      </v-expand-x-transition>
      <v-tooltip location="bottom" :text="localeActionLabel">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :aria-label="localeActionLabel"
            @click="preferences.toggleLocale()"
          >
            <span :lang="preferences.locale === 'zh' ? 'en' : 'zh-CN'">
              {{ preferences.locale === "zh" ? "EN" : "中文" }}
            </span>
          </v-btn>
        </template>
      </v-tooltip>
      <v-tooltip location="bottom" :text="themeActionLabel">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            :aria-label="themeActionLabel"
            @click="preferences.toggleTheme()"
          >
            <v-icon>{{
              preferences.themeName === "dark"
                ? "mdi-weather-sunny"
                : "mdi-weather-night"
            }}</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";
import { LOGIN_PATH } from "@/router/auth";

const store = useAppStore();
const preferences = usePreferencesStore();
const { labels: t } = storeToRefs(preferences);
const router = useRouter();
const themeActionLabel = computed(() =>
  preferences.themeName === "dark" ? t.value.toLight : t.value.toDark,
);
const localeActionLabel = computed(() =>
  preferences.locale === "zh" ? t.value.toEnglish : t.value.toChinese,
);

const { name, search, isAuthenticated, useAuthentication } = storeToRefs(store);

const showSearch = ref(false);

function logout() {
  store.logout();
  router.push(LOGIN_PATH);
}
</script>

<style scoped>
:deep(.search-input .v-input__control) {
  min-width: 400px;
}
</style>
