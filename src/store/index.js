import Vue from 'vue'
import Vuex from 'vuex'
import * as multivisor from '@/multivisor'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    multivisor: multivisor.nullMultivisor,
    notifications: [],
    selectedProcesses: [],
    search: '',
    log: {
      process: null,
      visible: false,
      stream: 'out'
    },
    processDetails: {
      process: multivisor.nullProcess,
      visible: false
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
    setSelectedProcesses (state, selectedProcesses) {
      state.selectedProcesses = selectedProcesses
    },
    addSelectedProcesses (state, processes) {
      let toAdd = new Set([...state.selectedProcesses, ...processes])
      state.selectedProcesses = [...toAdd]
    },
    removeSelectedProcesses (state, processes) {
      let toRemove = new Set(processes)
      state.selectedProcesses = state.selectedProcesses.filter(process => !toRemove.has(process))
    },
    updateSearch (state, search) {
      state.search = search
    },
    setProcessDetailsVisible (state, visible) {
      state.processDetails.visible = visible
    },
    setProcessDetails (state, details) {
      state.processDetails = details
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
    },
    selectAll () {
      this.commit('setSelectedProcesses', [...this.getters.filteredProcessUIDs])
    },
    clearSelected () {
      this.commit('setSelectedProcesses', [])
    },
    restartSelected () {
      this.dispatch('restartProcesses', this.state.selectedProcesses).then(() => {
        this.dispatch('clearSelected')
      })
    },
    stopSelected () {
      this.dispatch('stopProcesses', this.state.selectedProcesses).then(() => {
        this.dispatch('clearSelected')
      })
    }
  },
  getters: {
    name (state) {
      return state.multivisor.name
    },
    supervisors (state) {
      return Object.values(state.multivisor.supervisors)
    },
    processes (state, getters) {
      return getters.supervisors.reduce((processes, supervisor) => {
        processes.push(...Object.values(supervisor.processes))
        return processes
      }, [])
    },
    groupMap (state, getters) {
      return getters.processes.reduce((groups, proc) => {
        (proc.group in groups && groups[proc.group].processes.push(proc)) ||
          (groups[proc.group] = { name: proc.group, processes: [proc] })
        return groups
      }, {})
    },
    groups (state, getters) {
      return Object.values(getters.groupMap)
    },
    supervisor (state) {
      return (uid) => { return state.multivisor.supervisors[uid] }
    },
    process (state, getters) {
      return (uid) => {
        return getters.processes.find((process) => {
          return process.uid === uid
        })
      }
    },
    group (state, getters) {
      return (name) => { return getters.groupMap[name] }
    },
    filteredProcessUIDs (state, getters) {
      if (!state.search) {
        return new Set(getters.processes.map(process => process.uid))
      }
      let search = state.search.toLowerCase()
      return getters.processes.reduce((filtered, process) => {
        if (process.uid.toLowerCase().indexOf(search) !== -1 ||
            process.statename.toLowerCase().indexOf(search) !== -1) {
          filtered.add(process.uid)
        }
        return filtered
      }, new Set())
    },
    filteredGroupMap (state, getters) {
      if (!state.search) {
        return getters.groups
      }
      let filteredProcesses = getters.filteredProcessUIDs
      return getters.processes.reduce((groups, proc) => {
        if (filteredProcesses.has(proc.uid)) {
          (proc.group in groups && groups[proc.group].processes.push(proc)) ||
            (groups[proc.group] = { name: proc.group, processes: [proc] })
        }
        return groups
      }, {})
    },
    filteredGroups (state, getters) {
      return Object.values(getters.filteredGroupMap)
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
    },
    nbGroups (state, getters) {
      return getters.groups.length
    }
  }
})
