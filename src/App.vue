<template>
  <v-app >
    <ToolBar></ToolBar>
    <v-content>
      <v-container fluid>
        <v-layout justify-center>
          <v-card>
          <ProcessTable></ProcessTable>
        </v-card>
        </v-layout>
      </v-container>
    </v-content>
    <NotificationBar></NotificationBar>
    <LogSheet></LogSheet>
  </v-app>
</template>

<script>
  import ToolBar from './components/ToolBar'
  import LogSheet from './components/process/Log'
  import ProcessTable from './components/process/Table'
  import NotificationBar from './components/NotificationBar'

  export default {
    components: {
      ToolBar,
      LogSheet,
      ProcessTable,
      NotificationBar
    },
    computed: {
      logVisible: {
        get () { return this.$store.state.log.visible },
        set (v) { this.$store.commit('setLogVisible', v) }
      }
    }
  }
</script>
