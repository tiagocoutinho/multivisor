<template>
  <div>
  <v-footer dark app class="info">
    <v-layout row wrap justify-center>
      <v-flex xs12 py-3 text-xs-center white--text>
        <ProcessChip></ProcessChip>
        <SupervisorChip></SupervisorChip>
        <GroupChip class="mx-2"></GroupChip>
      </v-flex>
    </v-layout>
    <ActionBar></ActionBar>
  </v-footer>
</div>
</template>

<script>
import ProcessChip from './process/Chip'
import SupervisorChip from './supervisor/Chip'
import GroupChip from './group/Chip'
import ActionBar from './ActionBar'

export default {
  components: { ActionBar, ProcessChip, SupervisorChip, GroupChip }
}
</script>
