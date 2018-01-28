<template>
  <div>
    <NavBar :multivisor="multivisor"></NavBar>
    <h1>Dashboard</h1>
    <h3>Processes</h3>
    <Processes :multivisor="multivisor"></Processes>
  </div>
</template>

<script>
import NavBar from './NavBar'
import Processes from './Processes'

export default {
  name: 'Dashboard',
  props: ['multivisor'],
  components: {
    NavBar,
    Processes,
  },
}
</script>
