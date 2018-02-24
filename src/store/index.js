import Vue from 'vue'
import Vuex from 'vuex'
import * as multivisor from '../multivisor'
Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    multivisor: multivisor.nullMultivisor,
    user: {
      id: 'admin',
      role: 'administrator'
    },
    notifications: [],
    selectedProcesses: [],
    search: '',
    log: {
      process: null,
      visible: false,
      stream: 'out'
    }
  },
  mutations: {
    updateMultivisor (state, multivisor) {
      state.multivisor = multivisor
    },
    updateProcess (state, process) {
      let supervisor = state.multivisor.supervisors[process.supervisor]
      supervisor.processes[process.uid] = process
    },
    updateSupervisor (state, supervisor) {
      state.multivisor.supervisors[supervisor.name] = supervisor
    },
    newNotification (state, notification) {
      state.notifications.push(notification)
    },
    setLogVisible (state, visible) {
      state.log.visible = visible
    },
    setLog (state, log) {
      state.log = log
    },
    updateSelectedProcesses (state, selectedProcesses) {
      state.selectedProcesses = selectedProcesses
    },
    updateSearch (state, search) {
      state.search = search
    }
  },
  actions: {
    init ({ commit }) {
      multivisor.load()
        .then((data) => {
          commit('updateMultivisor', data)
          const eventHandler = (event) => {
            if (event.event === 'process_changed') {
              commit('updateProcess', event.payload)
            } else if (event.event === 'supervisor_changed') {
              commit('updateSupervisor', event.payload)
            } else if (event.event === 'notification') {
              commit('newNotification', event.payload)
            }
          }
          multivisor.streamTo(eventHandler)
        })
    },
    restartProcesses (context, uids) {
      multivisor.processAction(uids, 'restart')
    },
    stopProcesses (context, uid) {
      multivisor.processAction(uid, 'stop')
    }

  },
  getters: {

    supervisors (state) {
      return Object.values(state.multivisor.supervisors)
    },
    processes (state, getters) {
      let r = getters.supervisors.reduce((processes, supervisor) => {
        processes.push(...Object.values(supervisor.processes))
        return processes
      }, [])
      return r
    },
    process (state) {
      return (uid) => {
        return state.processes.find((process) => {
          return process.uid === uid
        })
      }
    },
    totalNbProcesses (state, getters) {
      return getters.processes.length
    },
    nbRunningProcesses (state, getters) {
      return getters.processes.reduce((acc, process) => {
        return process.running ? acc + 1 : acc
      }, 0)
    },
    nbStoppedProcesses (state, getters) {
      return getters.totalNbProcesses - getters.nbRunningProcesses
    },
    totalNbSupervisors (state, getters) {
      return getters.supervisors.length
    },
    nbRunningSupervisors (state, getters) {
      return getters.supervisors.reduce((acc, supervisor) => {
        return supervisor.running ? acc + 1 : acc
      }, 0)
    },
    nbStoppedSupervisors (state, getters) {
      return getters.totalNbSupervisors - getters.nbRunningSupervisors
    }
  }
})
