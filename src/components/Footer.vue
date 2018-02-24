<template>
  <v-footer dark app class="info">
    <v-layout row wrap justify-center>
      <v-flex xs12 py-3 text-xs-center white--text>
        <ProcessChip></ProcessChip>
        <SupervisorChip></SupervisorChip>
      </v-flex>
    </v-layout>
  </v-footer>
</template>

<script>
import ProcessChip from './process/Chip'
import SupervisorChip from './supervisor/Chip'

export default { components: { ProcessChip, SupervisorChip } }
</script>
