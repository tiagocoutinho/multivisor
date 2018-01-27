<template>
  <div>
    <table>
      <tr>
        <th colspan="5">{{supervisor.name}}</th>
      </tr>
      <tr>
        <th><input type="checkbox"></input></th>
        <th>Name</th>
        <th>Group</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
      <tr v-for="process in supervisor.processes">
        <td><input type="checkbox"></input></td>
        <td>{{ process.name }}</td>
        <td>{{ process.group }}</td>
        <td>{{ process.statename }}</td>
        <td>
          <button v-on:click="restartProcess(process)">(Re)Start</button>
          <button v-bind:disabled="!process.running"
                  v-on:click="stopProcess(process)">Stop</button>
          <button>Info</button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
  export default {
    name: "Supervisor",
    props: ['supervisor'],
    computed: {
      processes() {
        return Object.values(supervisor.processes);
      }
    },
    methods: {
      restartProcess: function(process) {
        console.log('restart ' + process.name);
      },
      stopProcess:  function(process) {
        alert('stop ' + process.name);
      },
    },
  }
</script>
