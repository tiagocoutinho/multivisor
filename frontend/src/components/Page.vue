<template>
    <el-container>
      <el-header>
        <Summary :multivisor="multivisor"></Summary>
      </el-header>
      <el-main>
        <Dashboard :multivisor="multivisor"></Dashboard>
      </el-main>
      <el-footer height="30">Footer</el-footer>
    </el-container>
</template>

<script>
import Summary from './Summary'
import Dashboard from './Dashboard'

export default {
  name: 'Page',
  props: ['multivisor'],
  components: {
    Summary,
    Dashboard,
  },
}
</script>
