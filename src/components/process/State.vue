<template lang="html">
  <v-chip disabled label :color="stateColorMap[state]"
          text-color="white" :small="small">
          {{ state }}
  </v-chip>
</template>

<script>
import { stateColorMap } from '../../multivisor'

export default {
  name: 'ProcessState',
  props: {
    state: { default: 'UNKNOWN' },
    small: { default: false }
  },
  data () { return { stateColorMap } }
}
</script>
