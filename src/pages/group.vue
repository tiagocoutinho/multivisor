<template>
  <v-container fluid>
    <v-data-iterator
      item-key="name"
      :items="filteredGroups"
      :no-results-text="t.noResult"
      :no-data-text="t.emptyProcesses"
    >
      <v-row>
        <v-col
          v-for="group in filteredGroups"
          cols="12"
          sm="12"
          md="6"
          lg="4"
          xl="3"
        >
          <GroupCard :group="group"></GroupCard>
        </v-col>
      </v-row>
    </v-data-iterator>
  </v-container>
</template>

<script setup>
import GroupCard from "@/components/group/Card";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { filteredGroups } = storeToRefs(store);
</script>
