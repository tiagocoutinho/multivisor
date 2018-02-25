<template>
  <v-card>
    <v-toolbar dense color="purple darken-2" dark>
      <v-toolbar-title>{{ group.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <GroupList :group="group"></GroupList>
  </v-card>
</template>

<script>
import GroupList from './List'

export default {
  name: 'GroupCard',
  props: ['item'],
  components: {
    GroupList
  },
  computed: {
    group () { return this.item.item }
  }
}
</script>
