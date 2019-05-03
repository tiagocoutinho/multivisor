<template>
  <v-app >
    <ToolBar></ToolBar>
    <v-content>
      <v-container fluid grid-list-md>
        <AlertBar></AlertBar>
        <router-view></router-view>
      </v-container>
    </v-content>
    <NotificationBar></NotificationBar>
    <LogSheet></LogSheet>
    <ProcessDetails></ProcessDetails>
  </v-app>
</template>

<script>
import ToolBar from '@/components/ToolBar'
import NotificationBar from '@/components/NotificationBar'
import AlertBar from '@/components/AlertBar'

import LogSheet from '@/components/process/Log'
import ProcessDetails from '@/components/process/Details'

export default {
  components: {
    ToolBar,
    LogSheet,
    ProcessDetails,
    NotificationBar,
    AlertBar
  }
}
</script>
