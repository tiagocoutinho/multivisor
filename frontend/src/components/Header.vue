<template>
  <div class="navbar navbar-top">
    #P: {{ total_processes }} (Up: {{ total_running_processes }})
    | #S: {{ total_supervisors }} (Up: {{ total_running_supervisors }})
  </div>
</template>

<script>
export default {
  name: 'Header',
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
  },
}
</script>
