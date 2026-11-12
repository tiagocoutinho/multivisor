import { defineStore } from "pinia";
import { markRaw } from "vue";

import * as multivisor from "@/multivisor";
import * as api from "@/api";
import { useInspectorStore } from "@/stores/inspector";

export const MULTIVISOR_CONNECTION_ERROR =
  "Couldn't connect to multivisor server, make sure it is running";

export const useAppStore = defineStore("app", {
  state: () => ({
    multivisor: multivisor.nullMultivisor,
    error: "",
    notifications: [],
    selectedProcesses: [],
    search: "",
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
    pendingProcessUids: [],
    pendingSupervisorNames: [],
    operationResults: [],
    confirmation: null,
    confirming: false,
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
    // 旧页面仍依赖 log/processDetails；真实可见状态只保存在 inspector。
    log() {
      const inspector = useInspectorStore();
      const process =
        inspector.visible && inspector.tab !== "details"
          ? this.process(inspector.uid)
          : null;
      return {
        process,
        stream: inspector.tab,
        visible: inspector.visible && inspector.tab !== "details",
      };
    },
    processDetails() {
      const inspector = useInspectorStore();
      return {
        process:
          inspector.visible && inspector.tab === "details"
            ? this.process(inspector.uid)
            : multivisor.nullProcess,
        visible: inspector.visible && inspector.tab === "details",
      };
    },
    confirmationUnavailable(state) {
      const current = state.confirmation;
      if (!current) return false;
      if (
        state.confirming ||
        state.pendingProcessUids.length ||
        state.pendingSupervisorNames.length ||
        !state.connected ||
        state.dataStatus !== "ready" ||
        (state.useAuthentication && !state.isAuthenticated)
      ) {
        return true;
      }
      if (current.kind === "supervisor") {
        const supervisor = state.multivisor.supervisors[current.name];
        return (
          !supervisor?.running ||
          !["update", "restart"].includes(current.action)
        );
      }
      return current.uids.some((uid) => {
        const process = this.process(uid);
        return (
          !process ||
          !state.multivisor.supervisors[process.supervisor]?.running ||
          !["start", "stop", "restart"].includes(current.action) ||
          (current.action === "start" && process.running) ||
          (current.action === "stop" && !process.running)
        );
      });
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
      useInspectorStore().close();
      this.confirmation = null;
      this.operationResults = [];
      this.disposeDataConnection();
      this.setLogout();
    },
    async runProcessAction(uids, action) {
      if (this.confirming) {
        return [];
      }
      this.confirming = true;
      const requestedUids = [...new Set(uids)];
      const generation = this._dataGeneration;
      this.operationResults = requestedUids.map((uid) =>
        this.makeProcessResult(uid, action, "not-submitted"),
      );
      const results = this.operationResults;
      try {
        for (const result of results) {
          const { uid } = result;
          if (
            generation !== this._dataGeneration ||
            !this.connected ||
            this.dataStatus !== "ready" ||
            (this.useAuthentication && !this.isAuthenticated) ||
            !["start", "stop", "restart"].includes(action)
          ) {
            continue;
          }
          const process = this.process(uid);
          const supervisor = this.multivisor.supervisors[process?.supervisor];
          if (
            !process ||
            !supervisor?.running ||
            (action === "start" && process.running) ||
            (action === "stop" && !process.running)
          ) {
            continue;
          }
          result.requestState = "sending";
          this.pendingProcessUids.push(uid);
          try {
            const response = await api.processAction(uid, action);
            result.httpStatus = response.status;
            result.requestState = response.ok ? "accepted" : "failed";
            if (generation === this._dataGeneration) {
              if (response.ok) this.removeSelectedProcesses([uid]);
              if (response.status === 401) this.handleUnauthorized();
            }
          } catch {
            result.requestState = "failed";
          } finally {
            const pendingIndex = this.pendingProcessUids.indexOf(uid);
            if (pendingIndex !== -1) {
              this.pendingProcessUids.splice(pendingIndex, 1);
            }
          }
          if (result.httpStatus === 401) break;
        }
      } finally {
        this.confirming = false;
      }
      return results;
    },
    async runSupervisorAction(name, action) {
      if (this.confirming) {
        return [];
      }
      this.confirming = true;
      this.operationResults = [
        {
          uid: undefined,
          name,
          supervisor: name,
          kind: "supervisor",
          action,
          requestState: "not-submitted",
          httpStatus: undefined,
        },
      ];
      const result = this.operationResults[0];
      const generation = this._dataGeneration;
      try {
        const supervisor = this.multivisor.supervisors[name];
        if (
          !this.connected ||
          this.dataStatus !== "ready" ||
          (this.useAuthentication && !this.isAuthenticated) ||
          !supervisor?.running ||
          !["update", "restart"].includes(action)
        ) {
          result.requestState = "not-submitted";
        } else {
          result.requestState = "sending";
          this.pendingSupervisorNames.push(name);
          try {
            const response = await api.supervisorAction(name, action);
            result.httpStatus = response.status;
            result.requestState = response.ok ? "accepted" : "failed";
            if (
              response.status === 401 &&
              generation === this._dataGeneration
            ) {
              this.handleUnauthorized();
            }
          } catch {
            result.requestState = "failed";
          } finally {
            const pendingIndex = this.pendingSupervisorNames.indexOf(name);
            if (pendingIndex !== -1) {
              this.pendingSupervisorNames.splice(pendingIndex, 1);
            }
          }
        }
      } finally {
        this.confirming = false;
      }
      return [result];
    },
    makeProcessResult(uid, action, requestState) {
      const process = this.process(uid);
      return {
        uid,
        name: process?.name || uid,
        supervisor: process?.supervisor || "",
        kind: "process",
        action,
        requestState,
        httpStatus: undefined,
      };
    },
    requestProcessAction(uids, action) {
      if (this.confirming || !uids.length) return;
      this.confirmation = { kind: "process", uids: [...new Set(uids)], action };
    },
    requestSupervisorAction(name, action) {
      if (this.confirming) return;
      this.confirmation = { kind: "supervisor", name, action };
    },
    cancelConfirmation() {
      if (!this.confirming) {
        this.confirmation = null;
      }
    },
    async confirmOperation() {
      const current = this.confirmation;
      if (!current || this.confirming) {
        return;
      }
      if (this.confirmationUnavailable) {
        this.confirmation = null;
        this.operationResults =
          current.kind === "process"
            ? current.uids.map((uid) =>
                this.makeProcessResult(uid, current.action, "not-submitted"),
              )
            : [
                {
                  ...this.makeProcessResult(
                    undefined,
                    current.action,
                    "not-submitted",
                  ),
                  uid: undefined,
                  name: current.name,
                  supervisor: current.name,
                  kind: "supervisor",
                },
              ];
        return;
      }
      const executed =
        current.kind === "process"
          ? await this.runProcessAction(current.uids, current.action)
          : await this.runSupervisorAction(current.name, current.action);
      this.confirmation = null;
      return executed;
    },
    restartProcesses(uids) {
      this.requestProcessAction(uids, "restart");
    },
    stopProcesses(uid) {
      this.requestProcessAction(uid, "stop");
    },
    selectAll() {
      this.setSelectedProcesses([...this.filteredProcessUIDs]);
    },
    clearSelected() {
      this.setSelectedProcesses([]);
    },
    restartSelected() {
      if (this.selectedProcesses.length) {
        this.requestProcessAction(this.selectedProcesses, "restart");
      }
    },
    stopSelected() {
      if (this.selectedProcesses.length) {
        this.requestProcessAction(this.selectedProcesses, "stop");
      }
    },
    requestSupervisorUpdate(uid) {
      this.requestSupervisorAction(uid, "update");
    },
    restartSupervisor(uid) {
      this.requestSupervisorAction(uid, "restart");
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
      const inspector = useInspectorStore();
      if (!visible && inspector.tab !== "details") {
        inspector.close();
      }
    },
    setLog(log) {
      if (log.visible === false) {
        useInspectorStore().close();
        return;
      }
      useInspectorStore().open(log.process.uid, log.stream);
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
      const inspector = useInspectorStore();
      if (!visible && inspector.tab === "details") {
        inspector.close();
      }
    },
    setProcessDetails(details) {
      if (details.visible === false) {
        useInspectorStore().close();
        return;
      }
      useInspectorStore().open(details.process.uid, "details");
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
