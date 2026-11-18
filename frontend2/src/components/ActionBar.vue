<template>
  <div>
    <v-speed-dial
      open-on-hover
      transition="scale-transition"
      direction="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" :aria-label="t.moreActions">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="green-darken-2"
            @click="restartSelected()"
            :aria-label="t.restartSelected"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-autorenew</v-icon>
          </v-btn>
        </template>
        <span>{{ t.restartSelected }}</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="red-darken-2"
            @click="stopSelected()"
            :aria-label="t.stopSelected"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-stop</v-icon>
          </v-btn>
        </template>
        <span>{{ t.stopSelected }}</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="blue-darken-1"
            @click="clearSelected()"
            :aria-label="t.clearSelection"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-checkbox-blank-outline</v-icon>
          </v-btn>
        </template>
        <span>{{ t.clearSelection }}</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="blue-darken-1"
            @click="selectAll()"
            :aria-label="t.selectAll"
            v-bind="props"
          >
            <v-icon>mdi-check-all</v-icon>
          </v-btn>
        </template>
        <span>{{ t.selectAll }}</span>
      </v-tooltip>
    </v-speed-dial>
  </div>
</template>

<script setup>
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { selectedProcesses } = storeToRefs(store);

const { selectAll, clearSelected, restartSelected, stopSelected } = store;
</script>
