<template>
  <v-container>
    <h1>{{ t.about }}</h1>
    {{ t.aboutDesc }}
    <p class="text-medium-emphasis">{{ t.aboutVersion }} {{ version }}</p>

    <h2>{{ t.aboutContent.features }}</h2>
    <ul>
      <li>{{ t.aboutContent.featureStatus }}</li>
      <li>{{ t.aboutContent.featureActions }}</li>
      <li>{{ t.aboutContent.featureNotifications }}</li>
      <li>{{ t.aboutContent.featureMobile }}</li>
      <li>{{ t.aboutContent.featureFilters }}</li>
      <li>{{ t.aboutContent.featureCli }}</li>
      <li>{{ t.aboutContent.featurePlatforms }}</li>
    </ul>

    <h2>{{ t.aboutContent.components }}</h2>
    {{ t.aboutContent.componentIntro }}
    <ul>
      <li>
        {{ t.aboutContent.componentWeb }}
      </li>
      <li>
        {{ t.aboutContent.componentRpc }}
      </li>
      <li>
        {{ t.aboutContent.componentCli }}
      </li>
    </ul>
  </v-container>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences";

const { labels: t } = storeToRefs(usePreferencesStore());
const version = __APP_VERSION__;
</script>
