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
        <th>Details</th>
      </tr>
      <tr v-for="process in processes">
        <td><input type="checkbox"
             v-model="selected_processes[process.uid]"></input></td>
        <td>{{ process.name }}</td>
        <td>{{ process.group }}</td>
        <td>{{ process.supervisor }}</td>
        <td>{{ process.host }}</td>
        <td>{{ process.statename }}</td>
        <td>
          <button @click="restart_process(process)">(Re)Start</button>
          <button :disabled="!process.running"
                  @click="stop_process(process)">Stop</button>
          <button @click="process_info(process)">Info</button>
          <button @click="log(process)">Log</button>
        </td>
        <td>{{ process.description }}</td>
      </tr>
    </table>
    <div>
      <button @click="restart_selected()">(Re)Start Selected</button>
      <button @click="stop_selected()">Stop Selected</button>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Processes',
  props: ['multivisor'],
  data() {
    return {
      selected_processes: {},
    }
  },
  methods: {
    get_supervisor(name) {
      return this.multivisor.data.supervisors[name];
    },
    restart_process(process) {
      var supervisor = this.get_supervisor(process.supervisor);
      this.multivisor.restart_process(process);
    },
    stop_process(process) {
      var supervisor = this.get_supervisor(process.supervisor);
      this.multivisor.stop_process(process);
    },
    process_info(process) {
      var multivisor = this.multivisor;
      var supervisor = this.get_supervisor(process.supervisor);
      multivisor.process_info(process)
        .then(function(updated_process) {
          alert(multivisor.process_string(updated_process));
        });
    },
    restart_selected() {
      alert(Object.keys(this.selected_processes));
    }
  },
  computed: {
    processes() {
      return this.multivisor.get_processes(this.multivisor);
    },
  }
}
</script>
