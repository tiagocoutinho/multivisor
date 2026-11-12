import { defineStore } from "pinia";
import { markRaw } from "vue";

import * as multivisor from "@/multivisor";
import * as api from "@/api";

export const MULTIVISOR_CONNECTION_ERROR =
  "Couldn't connect to multivisor server, make sure it is running";

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
    dataStatus: "idle",
    connected: false,
    refreshing: false,
    lastDataUpdate: null,
    loadError: "",
    _dataConnection: null,
    _dataRequest: null,
    _dataGeneration: 0,
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
      if (this._dataConnection) {
        return;
      }
      const generation = this._dataGeneration;
      await this.refresh();
      if (
        generation !== this._dataGeneration ||
        this.dataStatus !== "ready" ||
        this._dataConnection
      ) {
        return;
      }

      let opened = false;
      let connection;
      const eventHandler = (event) => {
        if (this._dataConnection !== connection) {
          return;
        }
        if (event === "error" || event === "close") {
          this.connected = false;
          this.setMultivisorError();
        } else if (event.event === "process_changed") {
          this.updateProcess(event.payload);
        } else if (event.event === "supervisor_changed") {
          this.updateSupervisor(event.payload);
        } else if (event.event === "notification") {
          this.newNotification(event.payload);
        }
      };
      connection = markRaw(api.streamTo(eventHandler));
      this._dataConnection = connection;
      connection.onopen = () => {
        if (this._dataConnection !== connection) {
          return;
        }
        const reconnected = opened && !this.connected;
        opened = true;
        this.connected = true;
        if (!this.loadError && this.error === MULTIVISOR_CONNECTION_ERROR) {
          this.setError("");
        }
        if (reconnected) {
          this.refresh();
        }
      };
    },
    refresh() {
      if (this._dataRequest) {
        return this._dataRequest;
      }
      const generation = this._dataGeneration;
      if (this.lastDataUpdate === null) {
        this.dataStatus = "loading";
      } else {
        this.refreshing = true;
      }
      this.loadError = "";

      const request = (async () => {
        try {
          const response = await api.load();
          if (generation !== this._dataGeneration) {
            return;
          }
          if (response.status === 401) {
            this.handleUnauthorized();
            return;
          }
          if (!response.ok) {
            throw new Error(MULTIVISOR_CONNECTION_ERROR);
          }
          const snapshot = await response.json();
          if (generation !== this._dataGeneration) {
            return;
          }
          this.updateMultivisor(snapshot);
          this.dataStatus = "ready";
          if (
            this.error === MULTIVISOR_CONNECTION_ERROR &&
            (!this._dataConnection || this.connected)
          ) {
            this.setError("");
          }
        } catch {
          if (generation !== this._dataGeneration) {
            return;
          }
          if (this.lastDataUpdate === null) {
            this.dataStatus = "error";
          }
          this.loadError = MULTIVISOR_CONNECTION_ERROR;
          this.setMultivisorError();
        } finally {
          if (generation === this._dataGeneration) {
            this.refreshing = false;
            this._dataRequest = null;
          }
        }
      })();
      this._dataRequest = request;
      return request;
    },
    disposeDataConnection() {
      const connection = this._dataConnection;
      this._dataConnection = null;
      // 快照请求可能早于事件连接开始；退出后也不能应用其晚到结果。
      this._dataGeneration += 1;
      this._dataRequest = null;
      this.connected = false;
      this.refreshing = false;
      if (this.dataStatus === "loading") {
        this.dataStatus = "idle";
      }
      connection?.close();
    },
    handleUnauthorized() {
      this.disposeDataConnection();
      this.setLogout();
    },
    restartProcesses(uids) {
      api.processAction(uids, "restart");
    },
    stopProcesses(uid) {
      api.processAction(uid, "stop");
    },
    selectAll() {
      this.setSelectedProcesses([...this.filteredProcessUIDs]);
    },
    clearSelected() {
      this.setSelectedProcesses([]);
    },
    restartSelected() {
      this.restartProcesses(this.selectedProcesses);
      this.clearSelected();
    },
    stopSelected() {
      this.stopProcesses(this.selectedProcesses);
      this.clearSelected();
    },
    requestSupervisorUpdate(uid) {
      api.supervisorAction(uid, "update");
    },
    restartSupervisor(uid) {
      api.supervisorAction(uid, "restart");
    },
    setMultivisorError() {
      this.error = MULTIVISOR_CONNECTION_ERROR;
    },
    logout() {
      this.handleUnauthorized();
      api.logout();
    },
    // Mutations
    updateMultivisor(multivisor) {
      this.multivisor = multivisor;
      this.lastDataUpdate = Date.now();
    },
    updateProcess(process) {
      let supervisor = this.multivisor.supervisors[process.supervisor];
      supervisor.processes[process.uid] = process;
      this.lastDataUpdate = Date.now();
    },
    updateSupervisor(supervisor) {
      this.multivisor.supervisors[supervisor.name] = supervisor;
      this.lastDataUpdate = Date.now();
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
  },
});
