<template>
  <v-container justify-center>
    <v-card elevation="4" class="overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="procs"
        :search="search"
        v-model="selectedProcesses"
        hide-actions
        select-all
        :no-results-text="t.noResult"
        :no-data-text="t.emptyProcesses"
        must-sort
        show-select
        item-key="uid"
      >
        <template v-slot:item.statename="{ item }">
          <v-chip
            label
            variant="flat"
            :color="stateColorMap[item.statename]"
            :text="t.stateNames[item.statename]"
            size="small"
          >
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center">
            <v-btn
              variant="flat"
              size="small"
              @click="restartProcess(item)"
              class="mx-0 my-1"
              :aria-label="item.running ? t.restart : t.start"
            >
              <v-icon color="green">
                <template v-if="item.running">mdi-autorenew</template>
                <template v-else>mdi-play</template>
              </v-icon>
            </v-btn>
            <v-btn
              variant="flat"
              size="small"
              @click="stopProcess(item)"
              :disabled="!item.running"
              :aria-label="t.stop"
              class="mx-0 my-1"
            >
              <v-icon color="red">mdi-stop</v-icon>
            </v-btn>
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="flat"
                  :aria-label="t.moreActions"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item @click="viewDetails(item)">
                  <v-list-item-title
                    ><v-icon size="small">mdi-information</v-icon>
                    {{ t.info }}</v-list-item-title
                  >
                </v-list-item>
                <v-list-item @click="viewLog(item, 'out')" v-if="item.logfile">
                  <v-list-item-title
                    ><v-icon size="small"
                      >mdi-file-document-alert-outline</v-icon
                    >{{ t.logOut }}</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="viewLog(item, 'err')"
                  v-if="item.stderr_logfile"
                >
                  <v-list-item-title
                    ><v-icon size="small"
                      >mdi-file-document-alert-outline</v-icon
                    >{{ t.logErr }}</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { stateColorMap } from "@/multivisor";

import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());

const { processes, showGroup, showSupervisor } = defineProps({
  processes: { default: null },
  showGroup: { default: true },
  showSupervisor: { default: true },
});

const headers = computed(() => {
  let header = [
    {
      align: "left",
      sortable: true,
      title: t.value.colName,
      value: "name",
      tooltip: t.value.colName,
    },
  ];
  if (showGroup) {
    header.push({
      align: "left",
      sortable: true,
      title: t.value.colGroup,
      value: "group",
      tooltip: t.value.colGroup,
      class: "hidden-xs-only",
    });
  }
  if (showSupervisor) {
    header.push({
      align: "left",
      sortable: true,
      title: t.value.colSupervisor,
      value: "supervisor",
      tooltip: t.value.colSupervisor,
      class: "hidden-xs-only",
    });
  }
  header.push({
    align: "left",
    sortable: true,
    title: t.value.colState,
    value: "statename",
    tooltip: t.value.colState,
  });
  header.push({
    align: "left",
    sortable: false,
    title: t.value.colActions,
    value: "actions",
    tooltip: t.value.colActions,
    width: "1%",
  });
  return header;
});

const search = computed(() => {
  return store.search;
});

const selectedProcesses = computed({
  get() {
    return store.selectedProcesses;
  },
  set(newValue) {
    store.setSelectedProcesses(newValue);
  },
});

const procs = computed(() => {
  return processes || store.processes;
});

const restartProcess = (process) => {
  store.restartProcesses([process.uid]);
};
const stopProcess = (process) => {
  store.stopProcesses([process.uid]);
};
const viewLog = (process, stream) => {
  store.setLog({
    process,
    stream,
    visible: true,
  });
};
const viewDetails = (process) => {
  store.setProcessDetails({
    process,
    visible: true,
  });
};
</script>

<style scoped>
/* Works around a bug in vuetify@3.8.1: VDataTableFooter.sass targets
   ".v-data-table-footer__paginationz" (typo) instead of
   ".v-data-table-footer__pagination", so the pagination block never
   gets its flex layout or left margin, causing it to overlap the
   items-per-page select. */
:deep(.v-data-table-footer__pagination) {
  align-items: center;
  display: flex;
  margin-inline-start: 16px;
}

/* The items-per-page select's v-input__control doesn't inherit its
   parent's width, so it overflows and drags its trailing caret across
   the footer onto the last-page button. */
:deep(.v-data-table-footer__items-per-page .v-input__control) {
  width: 100%;
  min-width: 0;
}
</style>
