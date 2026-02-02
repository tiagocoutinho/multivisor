<template>
  <v-container fluid grid-list-md>
    <v-data-iterator
      row
      wrap
      hide-actions
      item-key="name"
      :items="filteredGroups"
      no-results-text="Sorry, no matching processes found"
      no-data-text="Sorry, there are no processes currently being monitored"
    >
      <v-row>
        <v-col v-for="group in filteredGroups" xs12 sm12 md6 lg4 xl3>
          <GroupCard :group="group"></GroupCard>
        </v-col>
      </v-row>
    </v-data-iterator>
  </v-container>
</template>

<script setup>
import GroupCard from "@/components/group/Card";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { filteredGroups } = storeToRefs(store);
</script>
