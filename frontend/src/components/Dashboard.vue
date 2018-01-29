<template>
  <div id="dashboard">
    <h1>Dashboard</h1>
    <h3>Processes</h3>
    <Processes :multivisor="multivisor"></Processes>
    <h3>Supervisors</h3>
    <Supervisors :multivisor="multivisor"></Supervisors>
  </div>
</template>

<script>
import Processes from './Processes'
import Supervisors from './Supervisors'

export default {
  name: 'Dashboard',
  props: ['multivisor'],
  components: {
    Processes,
    Supervisors,
  },
}
</script>
