<template>
  <div>
    <NavBar :multivisor="multivisor"></NavBar>
    <h1>Dashboard</h1>
    <GlobalTable :multivisor="multivisor"></GlobalTable>
  </div>
</template>

<script>
import NavBar from './NavBar'
import GlobalTable from './GlobalTable'

export default {
  name: 'Dashboard',
  props: ['multivisor'],
  components: {
    NavBar,
    GlobalTable
  },
}
</script>
