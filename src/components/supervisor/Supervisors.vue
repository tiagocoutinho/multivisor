<template>
  <v-data-iterator
    content-tag="v-layout"
    row wrap hide-actions
    item-key="name"
    :items="supervisors"
    no-results-text="Sorry, no matching processes found"
    no-data-text="Sorry, there are no processes currently being monitored">
    <v-flex slot="item" slot-scope="props"
            xs12 sm6 md4 lg4>
      <SupervisorCard :item="props"></SupervisorCard>
    </v-flex>
  </v-data-iterator>
</template>

<script>
import SupervisorCard from './Card'

export default {
  components: {
    SupervisorCard
  },
  computed: {
    supervisors () {
      let supervisors = this.$store.getters.supervisors
      return supervisors.reduce((supervisors, supervisor) => {
        let procs = Object.values(supervisor.processes)
        let groups = Object.values(procs.reduce((groups, proc) => {
          if (this.filterProcess(proc)) {
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
  },
  methods: {
    filterProcess (process) {
      let search = this.$store.state.search.toLowerCase()
      return process.uid.toLowerCase().indexOf(search) !== -1
    }
  }
}
</script>
