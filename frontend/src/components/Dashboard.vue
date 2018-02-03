<template>
  <ProcessTable :multivisor="multivisor"></ProcessTable>
</template>

<script>
import ProcessTable from './ProcessTable'

export default {
  name: 'Dashboard',
  props: ['multivisor'],
  components: {
    ProcessTable,
  },
}
</script>
