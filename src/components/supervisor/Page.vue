<template>
  <div>
  <v-data-iterator
    content-tag="v-layout"
    row wrap hide-actions
    item-key="name"
    :items="supervisorsGroups"
    no-results-text="Sorry, no matching processes found"
    no-data-text="Sorry, there are no processes currently being monitored">
    <v-flex slot="item" slot-scope="props"
            xs12 sm12 md6 lg4>
      <SupervisorCard :item="props"></SupervisorCard>
    </v-flex>
  </v-data-iterator>
</div>
</template>

<script>
import SupervisorCard from './Card'

export default {
  name: 'SupervisorPage',
  components: {
    SupervisorCard
  },
  computed: {
    supervisorsGroups () {
      let supervisors = this.$store.getters.supervisors
      let filteredProcesses = this.$store.getters.filteredProcessUIDs
      return supervisors.reduce((supervisors, supervisor) => {
        let procs = Object.values(supervisor.processes)
        let groups = Object.values(procs.reduce((groups, proc) => {
          if (filteredProcesses.has(proc.uid)) {
            // check if group already exists, if not create it and add process
            (proc.group in groups && groups[proc.group].processes.push(proc)) ||
              (groups[proc.group] = { name: proc.group, processes: [proc] })
          }
          return groups
        }, {}))
        if (groups.length) {
          supervisors.push({...supervisor, groups: groups})
        }
        return supervisors
      }, [])
    }
  }
}
</script>
