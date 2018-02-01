<template>
  <div>
    <ProcessTable :multivisor="multivisor"></ProcessTable>
    <!--<Supervisors :multivisor="multivisor"></Supervisors>-->
  </div>
</template>

<script>
import ProcessTable from './ProcessTable'
import Supervisors from './Supervisors'

export default {
  name: 'Dashboard',
  props: ['multivisor'],
  components: {
    ProcessTable,
    Supervisors
  },
}
</script>
