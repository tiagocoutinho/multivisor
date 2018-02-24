<template>
  <v-card>
    <v-card-text>
      <i>Last updated: {{lastUpdate}}</i><br/>
      Host:<b>{{process.host}}</b></br>
      PID:<b>{{process.pid}}</b><br/>
      Started at:<b>{{startTime}}</b><br/>
      Details:<b>{{process.description}}</b><br/>
      Last exit status:<b>{{process.exitstatus}}</b><br/>
      <template v-if="process.logfile">
        Log:<b>{{process.logfile}}</b><br/>
      </template>
      <template v-if="process.stderr_logfile">
        Err log:<b>{{process.stderr_logfile}}</b><br/>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>

import { timeAgo } from '../../multivisor'

export default {
  name: 'ProcessDetails',
  props: ['process'],
  computed: {
    startTime () {
      return Date(this.process.start)
    },
    lastUpdate () {
      return timeAgo(this.process.now)
    }
  }
}
</script>
