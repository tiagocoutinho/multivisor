import { defineStore } from "pinia";

import * as multivisor from "@/multivisor";
import * as api from "@/api";

export const useAppStore = defineStore("app", {
  state: () => ({
    multivisor: multivisor.nullMultivisor,
    error: "",
    notifications: [],
    selectedProcesses: [],
    search: "",
    log: {
      process: null,
      visible: false,
      stream: "out",
    },
    processDetails: {
      process: multivisor.nullProcess,
      visible: false,
    },
    isAuthenticated: undefined,
    useAuthentication: undefined,
  }),
  getters: {
    name(state) {
      return state.multivisor.name;
    },
    supervisors(state) {
      return Object.values(state.multivisor.supervisors);
    },
    processes(state) {
      return this.supervisors.reduce((processes, supervisor) => {
        processes.push(...Object.values(supervisor.processes));
        return processes;
      }, []);
    },
    groupMap(state) {
      return this.processes.reduce((groups, proc) => {
        (proc.group in groups && groups[proc.group].processes.push(proc)) ||
          (groups[proc.group] = { name: proc.group, processes: [proc] });
        return groups;
      }, {});
    },
    groups(state) {
      return Object.values(this.groupMap);
    },
    supervisor(state) {
      return (uid) => {
        return state.multivisor.supervisors[uid];
      };
    },
    process(state) {
      return (uid) => {
        return this.processes.find((process) => {
          return process.uid === uid;
        });
      };
    },
    group(state) {
      return (name) => {
        return this.groupMap[name];
      };
    },
    filteredProcessUIDs(state) {
      if (!state.search) {
        return new Set(this.processes.map((process) => process.uid));
      }
      let search = state.search.toLowerCase();
      return this.processes.reduce((filtered, process) => {
        if (
          process.uid.toLowerCase().indexOf(search) !== -1 ||
          process.statename.toLowerCase().indexOf(search) !== -1
        ) {
          filtered.add(process.uid);
        }
        return filtered;
      }, new Set());
    },
    filteredGroupMap(state) {
      if (!state.search) {
        return this.groups;
      }
      let filteredProcesses = this.filteredProcessUIDs;
      return this.processes.reduce((groups, proc) => {
        if (filteredProcesses.has(proc.uid)) {
          (proc.group in groups && groups[proc.group].processes.push(proc)) ||
            (groups[proc.group] = { name: proc.group, processes: [proc] });
        }
        return groups;
      }, {});
    },
    filteredGroups(state) {
      return Object.values(this.filteredGroupMap);
    },
    totalNbProcesses(state) {
      return this.processes.length;
    },
    nbRunningProcesses(state) {
      return this.processes.reduce((acc, process) => {
        return process.running ? acc + 1 : acc;
      }, 0);
    },
    nbStoppedProcesses(state) {
      return this.totalNbProcesses - this.nbRunningProcesses;
    },
    totalNbSupervisors(state) {
      return this.supervisors.length;
    },
    nbRunningSupervisors(state) {
      return this.supervisors.reduce((acc, supervisor) => {
        return supervisor.running ? acc + 1 : acc;
      }, 0);
    },
    nbStoppedSupervisors(state) {
      return this.totalNbSupervisors - this.nbRunningSupervisors;
    },
    nbGroups(state) {
      return this.groups.length;
    },
  },
  actions: {
    async init() {
      const response = await api.load();
      if (response.status === 401) {
        return;
      } else if (response.status === 504) {
        // server down
        this.setMultivisorError();
      } else {
        const res = await response.json();
        this.updateMultivisor(res);
      }
      const eventHandler = (event) => {
        if (event === "error" || event === "close") {
          this.setMultivisorError();
          this.multivisor = multivisor.nullMultivisor;
        } else if (event.event === "process_changed") {
          this.updateProcess(event.payload);
        } else if (event.event === "supervisor_changed") {
          this.updateSupervisor(event.payload);
        } else if (event.event === "notification") {
          this.newNotification(event.payload);
        }
      };
      api.streamTo(eventHandler);
    },
    restartProcesses(uids) {
      api.processAction(uids, "restart");
    },
    stopProcesses(uid) {
      api.processAction(uid, "stop");
    },
    selectAll() {
      this.setSelectedProcesses([...this.getters.filteredProcessUIDs]);
    },
    clearSelected() {
      this.setSelectedProcesses([]);
    },
    restartSelected() {
      this.dispatch("restartProcesses", this.state.selectedProcesses).then(
        () => {
          this.dispatch("clearSelected");
        },
      );
    },
    stopSelected() {
      this.dispatch("stopProcesses", this.state.selectedProcesses).then(() => {
        this.dispatch("clearSelected");
      });
    },
    updateSupervisor(uid) {
      api.supervisorAction(uid, "update");
    },
    restartSupervisor(uid) {
      api.supervisorAction(uid, "restart");
    },
    setMultivisorError() {
      this.error =
        "Couldn't connect to multivisor server, make sure it is running";
    },
    logout() {
      this.setLogout();
      api.logout();
    },
    // Mutations
    updateMultivisor(multivisor) {
      this.multivisor = multivisor;
    },
    updateProcess(process) {
      let supervisor = this.multivisor.supervisors[process.supervisor];
      supervisor.processes[process.uid] = process;
    },
    updateSupervisor(supervisor) {
      this.multivisor.supervisors[supervisor.name] = supervisor;
    },
    newNotification(notification) {
      this.notifications.push(notification);
    },
    setLogVisible(visible) {
      this.log.visible = visible;
    },
    setLog(log) {
      this.log = log;
    },
    setSelectedProcesses(selectedProcesses) {
      this.selectedProcesses = selectedProcesses;
    },
    addSelectedProcesses(processes) {
      let toAdd = new Set([...this.selectedProcesses, ...processes]);
      this.selectedProcesses = [...toAdd];
    },
    removeSelectedProcesses(processes) {
      let toRemove = new Set(processes);
      this.selectedProcesses = this.selectedProcesses.filter(
        (process) => !toRemove.has(process),
      );
    },
    updateSearch(search) {
      this.search = search;
    },
    setProcessDetailsVisible(visible) {
      this.processDetails.visible = visible;
    },
    setProcessDetails(details) {
      this.processDetails = details;
    },
    setIsAuthenticated(isAuthenticated) {
      this.isAuthenticated = isAuthenticated;
    },
    setUseAuthentication(useAuthentication) {
      this.useAuthentication = useAuthentication;
    },
    setLogout() {
      this.isAuthenticated = false;
    },
    setError(error) {
      this.error = error;
    },
    setMultivisorError() {
      this.error =
        "Couldn't connect to multivisor server, make sure it is running";
    },
  },
});
