<template>
    <el-container>
      <el-header height="30">{{multivisor.data.name}}</el-header>
      <el-main>
        <Dashboard :multivisor="multivisor"></Dashboard>
      </el-main>
      <el-footer height="30">Footer</el-footer>
    </el-container>
</template>

<script>
import Dashboard from './Dashboard'

export default {
  name: 'Page',
  props: ['multivisor'],
  components: {
    Dashboard,
  },
}
</script>
