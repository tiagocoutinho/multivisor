<template>
  <div>
    <table>
      <tr>
        <th><input type="checkbox"></input></th>
        <th>Name</th>
        <th>Host</th>
        <th>Running</th>
        <th>Processes</th>
        <th>Actions</th>
      </tr>
      <tr v-for="supervisor in multivisor.data.supervisors">
        <td><input type="checkbox"
             v-model="selected_supervisors[supervisor.name]"></input></td>
        <td>{{supervisor.name}}</td>
        <td>{{supervisor.host}}</td>
        <td>{{supervisor.running}}</td>
        <td>{{total_processes(supervisor)}}
            (Up: {{total_running_processes(supervisor)}})</td>
        <td>
          <button>Log</button>
          <button>Reread</button><!-- reread: reread config but don't add/remove -->
          <button>Reload</button><!-- update: reread and restart affected programs -->
          <button>Restart all</button>
          <button>Stop all</button>
          <button>Restart supervisor</button><!-- restart the supervisor process -->
        </td>
      </tr>
  </div>
</template>

<script>
export default {
  name: 'Supervisors',
  props: ['multivisor'],
  data() {
    return {
      selected_supervisors: {},
    }
  },
  methods: {
    processes(supervisor) {
      return this.multivisor.get_processes(this.multivisor, supervisor);
    },
    total_processes(supervisor) {
      return this.processes(supervisor).length;
    },
    total_running_processes(supervisor) {
      return this.processes(supervisor)
        .reduce((acc, process) => process.running ? acc + 1 : acc, 0);
    },
  }
}
</script>
