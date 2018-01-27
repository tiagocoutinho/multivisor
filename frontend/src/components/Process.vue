<template>
    <tr>
      <td><input type="checkbox"></input></td>
      <td>{{ process.node.data.identification }}</td>
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
</template>

<script>
  export default {
    name: "Host",
    props: {
      process: {
        type: Object
      }
    },

    data () {
      return {
        hostname: 'lid312'
      }
    },
    methods: {
      restartProcess: function(process) {
        console.log('restart ' + process['name']);
      },
      stopProcess:  function(process) {
        alert('stop ' + process['name']);
      },
    },
  }
</script>

<style scoped>
</style>
