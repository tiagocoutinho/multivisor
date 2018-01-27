<template>
  <div>
    <div v-for="supervisor in supervisors">
      <Supervisor :supervisor="supervisor"></Supervisor>
    </div>
  </div>
</template>

<script>
import Supervisor from './Supervisor'

export default {
  name: 'Supervisors',
  props: ['supervisors'],
  components: {
    Supervisor
  },
}
</script>
