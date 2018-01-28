<template>
  <nav>
    <!-- <button v-on:click="refresh()">Refresh</button> -->
    Processes: {{ total_processes }} (Up: {{ total_running_processes }})
    | Supervisors: {{ total_supervisors }} (Up: {{ total_running_supervisors }})
    | {{ log }}
  </nav>
</template>

<script>
export default {
  name: 'NavBar',
  props: ['multivisor'],
  computed: {
    total_supervisors() {
      return Object.keys(this.multivisor.data.supervisors).length;
    },
    total_running_supervisors() {
      return Object.values(this.multivisor.data.supervisors)
        .reduce((acc, supervisor) => supervisor.running ? acc + 1 : acc, 0);
    },
    processes() {
      return this.multivisor.get_processes(this.multivisor);
    },
    total_processes() {
        return this.processes.length;
    },
    total_running_processes() {
      return this.processes
        .reduce((acc, process) => process.running ? acc + 1 : acc, 0);
    },
    log() {
      let log = this.multivisor.log;
      if (log) {
        return log.level + ' at ' + Date(log.time*1000) + ': ' + log.message;
      }
      return '';
    }
  },
  methods: {
    refresh() {
      this.multivisor.refresh().then(data => {
          this.multivisor.data = data;
      });
    }
  }
}

</script>

<style scoped>
nav {background-color: rgb(211, 236, 205);}
</style>
