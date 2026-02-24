<template>
  <div>
    <v-speed-dial
      open-on-hover
      transition="scale-transition"
      direction="bottom"
    >
      <v-btn slot="activator" icon>
        <v-icon>more_vert</v-icon>
      </v-btn>

      <v-tooltip location="left">
        <v-btn
          slot="activator"
          size="small"
          color="green-darken-2"
          @click="restartSelected()"
          v-show="selectedProcesses.length"
        >
          <v-icon>autorenew</v-icon>
        </v-btn>
        <span>(Re)start selected processes</span>
      </v-tooltip>
      <v-tooltip location="left">
        <v-btn
          slot="activator"
          size="small"
          color="red-darken-2"
          @click="stopSelected()"
          v-show="selectedProcesses.length"
        >
          <v-icon>stop</v-icon>
        </v-btn>
        <span>Stop selected processes</span>
      </v-tooltip>
      <v-tooltip location="left">
        <v-btn
          slot="activator"
          size="small"
          color="blue-darken-1"
          @click="clearSelected()"
          v-show="selectedProcesses.length"
        >
          <v-icon>clear_all</v-icon>
        </v-btn>
        <span>Clear selection</span>
      </v-tooltip>
      <v-tooltip location="left">
        <v-btn
          slot="activator"
          size="small"
          color="blue-darken-1"
          @click="selectAll()"
        >
          <v-icon>select_all</v-icon>
        </v-btn>
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
