<template>
  <v-snackbar :timeout="5000" bottom right :color="color"
              v-model="visible">
    {{ lastNotification.message }}
  </v-snackbar>
</template>

<script>
import { notificationColorMap } from '../multivisor'

export default {
  name: 'NotificationBar',
  data () {
    return { visible: false, color: 'info' }
  },
  watch: {
    lastNotification (notification) {
      this.visible = true
      this.color = notificationColorMap[notification.level]
    }
  },
  computed: {
    lastNotification () {
      let n = this.$store.state.notifications.length
      return n ? this.$store.state.notifications[n - 1] : { message: '' }
    }
  }
}
</script>
