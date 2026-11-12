<template>
  <v-app-bar elevation="0" border="b">
    <v-app-bar-title class="cluster-title">
      <router-link to="/" class="cluster-link" :aria-label="t.navNodes">
        <v-icon color="primary" size="20">mdi-layers</v-icon>
        <span class="font-weight-medium" :title="store.name">{{
          store.name
        }}</span>
      </router-link>
    </v-app-bar-title>

    <v-tabs
      v-if="!isLogin && !isMobile"
      :model-value="navValue"
      color="primary"
      density="compact"
      class="main-nav"
    >
      <v-tab value="nodes" to="/">
        <v-icon size="16" class="mr-2">mdi-desktop-classic</v-icon
        >{{ t.navNodes }}
      </v-tab>
      <v-tab value="processes" to="/process">
        <v-icon size="16" class="mr-2">mdi-cog-outline</v-icon
        >{{ t.navProcesses }}
      </v-tab>
    </v-tabs>
    <v-spacer></v-spacer>

    <template #append>
      <div class="header-actions">
        <template v-if="!isLogin">
          <v-tooltip location="bottom" :text="t.refresh">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                :aria-label="t.refresh"
                :loading="store.refreshing"
                :disabled="store.dataStatus !== 'ready'"
                @click="store.refresh()"
                ><v-icon>mdi-refresh</v-icon></v-btn
              >
            </template>
          </v-tooltip>
          <v-menu
            v-if="store.useAuthentication && store.isAuthenticated"
            location="bottom end"
          >
            <template #activator="{ props }">
              <v-btn v-bind="props" icon :aria-label="t.user">
                <v-avatar color="primary" size="30"
                  ><v-icon size="22">mdi-account</v-icon></v-avatar
                >
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-account-circle"
                :title="t.user"
                :subtitle="t.loggedIn"
              ></v-list-item>
              <v-divider></v-divider>
              <v-list-item
                prepend-icon="mdi-information-outline"
                :title="t.about"
                @click="$emit('about')"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-logout"
                :title="t.logout"
                @click="store.logout()"
              ></v-list-item>
            </v-list>
          </v-menu>
        </template>

        <v-tooltip location="bottom" :text="themeActionLabel">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
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
        <v-btn
          variant="text"
          class="language-button"
          :aria-label="localeActionLabel"
          @click="preferences.toggleLocale()"
        >
          <v-icon size="18" class="mr-1">mdi-translate</v-icon>
          <span>{{ preferences.locale === "zh" ? "中" : "EN" }}</span>
        </v-btn>
      </div>
    </template>

    <template v-if="isMobile && !isLogin" #extension>
      <v-tabs
        :model-value="navValue"
        color="primary"
        density="compact"
        class="mobile-nav"
        grow
      >
        <v-tab value="nodes" to="/">
          <v-icon size="16" class="mr-2">mdi-desktop-classic</v-icon
          >{{ t.navNodes }}
        </v-tab>
        <v-tab value="processes" to="/process">
          <v-icon size="16" class="mr-2">mdi-cog-outline</v-icon
          >{{ t.navProcesses }}
        </v-tab>
      </v-tabs>
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";
import { LOGIN_PATH } from "@/router/auth";

defineEmits(["about"]);
const store = useAppStore();
const preferences = usePreferencesStore();
const { labels: t } = storeToRefs(preferences);
const route = useRoute();
const { width } = useDisplay();
const isMobile = computed(() => width.value <= 640);
const isLogin = computed(() => route.path === LOGIN_PATH);
const navValue = computed(() => {
  if (route.path === "/" || route.name === "supervisor-detail") return "nodes";
  if (route.path === "/process") return "processes";
  return null;
});
const themeActionLabel = computed(() =>
  preferences.themeName === "dark" ? t.value.toLight : t.value.toDark,
);
const localeActionLabel = computed(() =>
  preferences.locale === "zh" ? t.value.toEnglish : t.value.toChinese,
);
</script>

<style scoped>
.cluster-link {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.cluster-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
