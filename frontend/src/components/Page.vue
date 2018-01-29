<template>
  <div id="page">
    <Header :multivisor="multivisor"></Header>
    <Dashboard :multivisor="multivisor"></Dashboard>
    <Footer :multivisor="multivisor"></Footer>
  </div>
</template>

<script>
import Header from './Header'
import Footer from './Footer'
import Dashboard from './Dashboard'

export default {
  name: 'Page',
  props: ['multivisor'],
  components: {
    Header,
    Footer,
    Dashboard,
  },
}
</script>
<style>
.navbar {
  width:100%;
  height: 26px;
  position: fixed; }

.navbar-top {
  top: 0;
  background-color: rgb(205, 240, 205); }

.navbar-bottom {
  bottom: 0;
  background-color: rgb(240, 205, 205); }
</style>
