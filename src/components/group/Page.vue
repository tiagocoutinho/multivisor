<template>
  <v-container fluid grid-list-md>
      <v-data-iterator
        content-tag="v-layout"
        row wrap hide-actions
        item-key="name"
        :items="groups"
        no-results-text="Sorry, no matching processes found"
        no-data-text="Sorry, there are no processes currently being monitored">
        <v-flex slot="item" slot-scope="props"
                xs12 sm12 md6 lg4 xl3>
          <GroupCard :item="props"></GroupCard>
        </v-flex>
      </v-data-iterator>
  </v-container>
</template>

<script>
import GroupCard from './Card'
import { mapGetters } from 'vuex'

export default {
  name: 'GroupPage',
  components: {
    GroupCard
  },
  computed: {
    ...mapGetters({groups: 'filteredGroups'})
  }
}
</script>
