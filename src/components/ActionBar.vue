<template>
  <div>
    <v-speed-dial
      open-on-hover
      transition="scale-transition"
      direction="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="green-darken-2"
            @click="restartSelected()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-autorenew</v-icon>
          </v-btn>
        </template>
        <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="red-darken-2"
            @click="stopSelected()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-stop</v-icon>
          </v-btn>
        </template>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="blue-darken-1"
            @click="clearSelected()"
            v-show="selectedProcesses.length"
            v-bind="props"
          >
            <v-icon>mdi-checkbox-blank-outline</v-icon>
          </v-btn>
        </template>
        <span>Clear selection</span>
      </v-tooltip>
      <v-tooltip location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            size="small"
            color="blue-darken-1"
            @click="selectAll()"
            v-bind="props"
          >
            <v-icon>mdi-check-all</v-icon>
          </v-btn>
        </template>
        <span>Select all</span>
      </v-tooltip>
    </v-speed-dial>
  </div>
</template>

<script setup>
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const { selectedProcesses } = storeToRefs(store);

const { selectAll, clearSelected, restartSelected, stopSelected } = store;
</script>
