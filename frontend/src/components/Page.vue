<template>
  <el-container style="height:90%;">
    <el-main>
      <ProcessTable :multivisor="multivisor"></ProcessTable>
    </el-main>
  </el-container>
</template>

<script>
import ProcessTable from './ProcessTable'

export default {
  name: 'Page',
  props: ['multivisor'],
  components: {
    ProcessTable,
  },
}
</script>
