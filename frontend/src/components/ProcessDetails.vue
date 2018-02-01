<template>
  <div>
    Name:<b>{{process.name}}</b><br/>
    Full name:<b>{{process.full_name}}</b><br/>
    Group:<b>{{process.group}}</b><br/>
    Supervisor:<b>{{process.supervisor}}</b><br/>
    Host:<b>{{process.host}}</b><br/>
    PID:<b>{{process.pid}}</b><br/>
    Last exit status:<b>{{process.exitstatus}}</b><br/>
    Spawn error:<b>{{process.spawnerr}}</b><br/>
    Started at:<b>{{start_time}}</b><br/>
    Details:<b>{{process.description}}</b><br/>
    Log:<b>{{process.logfile}}</b><br/>
    Err log:<b>{{process.stderr_logfile}}</b><br/>
  </div>
</template>

<script>
export default {
  name: 'ProcessDetails',
  props: ["process"],
  computed: {
    start_time() {
      return Date(this.process.start);
    }
  }
}
</script>
