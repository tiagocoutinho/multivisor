<template>
  <v-container>
    <h1>About</h1>
    A centralized supervisor UI (Web & CLI)

    <h2>Features</h2>
    <ul>
      <li>Processes status always up to date</li>
      <li>Reactivity through asynchronous actions</li>
      <li>Notifications when state changes</li>
      <li>Mobile aware, SPA web page</li>
      <li>Powerful filters</li>
      <li>Interactive CLI</li>
      <li>Works on supervisor and supervisor-win</li>
    </ul>

    <h2>Components</h2>
    Multivisor is comprised of 3 components:
    <ul>
      <li>
        WEB server: gathers information from all supervisors and provides a
        dashboard like UI to the entire system multivisor
      </li>
      <li>
        RPC : an RPC extension to supervisor used to communicate between each
        supervisord and multivisor web server
      </li>
      <li>
        CLI: an optional CLI which communicates with multivisor web server
      </li>
    </ul>
  </v-container>
</template>
