<template>
  <el-row>
    <el-tag size="medium">{{multivisor.data.name}}</el-tag>
    Processes:
    <el-tag type="info" size="medium">{{ total_processes }}</el-tag>
    <el-tag type="success" size="medium">{{ total_running_processes }}</el-tag>
    <el-tag type="warning" size="medium">{{ total_processes - total_running_processes }}</el-tag>
    Supervisors:
    <el-tag type="info" size="medium">{{ total_supervisors }}</el-tag>
    <el-tag type="success" size="medium">{{ total_running_supervisors }}</el-tag>
    <el-tag type="warning" size="medium">{{ total_supervisors - total_running_supervisors }}</el-tag>
  </div>
</template>

<script>
export default {
  name: 'Summary',
  props: ['multivisor'],
  computed: {
    total_supervisors() {
      return Object.keys(this.multivisor.data.supervisors).length;
    },
    total_running_supervisors() {
      return Object.values(this.multivisor.data.supervisors)
        .reduce((acc, supervisor) => supervisor.running ? acc + 1 : acc, 0);
    },
    processes() {
      return this.multivisor.get_processes(this.multivisor);
    },
    total_processes() {
        return this.processes.length;
    },
    total_running_processes() {
      return this.processes
        .reduce((acc, process) => process.running ? acc + 1 : acc, 0);
    },
  },
}
</script>

<style>
.running {
  background-color: #00AA00;
  margin-top: 10px;
  margin-right: 40px;
}
</style>
