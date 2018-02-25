<template>
  <v-app >
    <ToolBar></ToolBar>
    <v-content>
      <v-container fluid grid-list-md>
        <SupervisorPage></SupervisorPage>
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
import SupervisorPage from './components/supervisor/Page'
import NotificationBar from './components/NotificationBar'

export default {
  components: {
    ToolBar,
    LogSheet,
    ProcessTable,
    SupervisorPage,
    NotificationBar
  }
}
</script>
