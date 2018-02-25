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
    <ProcessDetails></ProcessDetails>
  </v-app>
</template>

<script>
import ToolBar from './components/ToolBar'
import NotificationBar from './components/NotificationBar'

import SupervisorPage from './components/supervisor/Page'

import LogSheet from './components/process/Log'
import ProcessDetails from './components/process/Details'
import ProcessTable from './components/process/Table'

export default {
  components: {
    ToolBar,
    LogSheet,
    ProcessTable,
    ProcessDetails,
    SupervisorPage,
    NotificationBar
  }
}
</script>
