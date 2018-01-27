<template>
  <div>
    <table>
      <tr>
        <th><input type="checkbox"></input></th>
        <th>Name</th>
        <th>Group</th>
        <th>Supervisor</th>
        <th>Host</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
      <tr v-for="process in processes">
        <td><input type="checkbox"></input></td>
        <td>{{ process.name }}</td>
        <td>{{ process.group }}</td>
        <td>{{ process.supervisor }}</td>
        <td>{{ process.host }}</td>
        <td>{{ process.statename }}</td>
        <td>
          <button v-on:click="restart_process(process)">(Re)Start</button>
          <button v-bind:disabled="!process.running"
                  v-on:click="stop_process(process)">Stop</button>
          <button v-on:click="process_info(process)">Info</button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>

export default {
  name: 'GlobalTable',
  props: ['multivisor', 'data'],
  methods: {
    restart_process: function(process) {
      this.multivisor.restart_process(process);
    },
    stop_process: function(process) {
      this.multivisor.stop_process(process);
    },
    process_info: function(process) {
      var supervisor = this.data.supervisors[process.supervisor];
      this.multivisor.process_info(process)
        .then(function(new_process) {
          supervisor.processes[process.name] = new_process;
        });
    },
  },
  computed: {
    processes() {
      let processes = [];
      for(let sname in this.data.supervisors) {
        let supervisor = this.data.supervisors[sname];
        for(let pname in supervisor.processes) {
          let process = supervisor.processes[pname];
          processes.push(process);
        }
      }
      return processes;
    },
  }
}
</script>
