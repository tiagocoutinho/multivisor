<template>
  <div>
    <h1>Dashboard</h1>
    <GlobalTable :multivisor="multivisor" :data="data"></GlobalTable>
  </div>
</template>

<script>
import GlobalTable from './GlobalTable'

export default {
  name: 'Dashboard',
  props: ['multivisor', 'data'],
  components: {
    GlobalTable
  },
}
</script>
