<template>
  <v-container fluid grid-list-md>
    <v-data-iterator
      item-key="name"
      :items="supervisorsGroups"
      no-results-text="Sorry, no matching processes found"
      no-data-text="Sorry, there are no processes currently being monitored"
    >
      <v-row>
        <v-col
          v-for="supervisor in supervisorsGroups"
          cols="12"
          sm="12"
          md="6"
          lg="4"
        >
          <SupervisorCard :supervisor="supervisor"></SupervisorCard>
        </v-col>
      </v-row>
    </v-data-iterator>
  </v-container>
</template>

<script setup>
import SupervisorCard from "@/components/supervisor/Card";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const supervisorsGroups = computed(() => {
  let supervisors = store.supervisors;
  let filteredProcesses = store.filteredProcessUIDs;
  return supervisors.reduce((supervisors, supervisor) => {
    let procs = Object.values(supervisor.processes);
    let groups = Object.values(
      procs.reduce((groups, proc) => {
        if (filteredProcesses.has(proc.uid)) {
          // check if group already exists, if not create it and add process
          (proc.group in groups && groups[proc.group].processes.push(proc)) ||
            (groups[proc.group] = { name: proc.group, processes: [proc] });
        }
        return groups;
      }, {}),
    );
    supervisors.push({ ...supervisor, groups: groups });
    return supervisors;
  }, []);
});
</script>
