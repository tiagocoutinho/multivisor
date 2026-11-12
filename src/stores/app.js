import { defineStore } from "pinia";
import { markRaw } from "vue";

import * as multivisor from "@/multivisor";
import * as api from "@/api";
import { useInspectorStore } from "@/stores/inspector";

export const MULTIVISOR_CONNECTION_ERROR =
  "Couldn't connect to multivisor server, make sure it is running";

// 后台轮询周期与单次请求超时（毫秒）。
// connected 由轮询成败判定（服务端 API 是否可达），事件流只做实时性增强；
// 这样事件流静默（如后端心跳死锁）时数据依然新鲜、操作依然可用。
export const POLL_INTERVAL_MS = 30000;
export const POLL_TIMEOUT_MS = 10000;

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
    _pollTimer: null,
    _visibilityHandler: null,
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
      if (generation !== this._dataGeneration || this._dataConnection) {
        return;
      }
      // 轮询是连接状态与数据新鲜度的判定来源，首载成败都启动：
      // 首载失败时由轮询自动重试恢复，不再依赖用户手动刷新页面。
      this._startPolling();
      if (this.dataStatus === "ready") {
        this._connectStream();
      }
    },
    _connectStream() {
      // 事件流只承担实时性增强：业务事件即时更新数据即可；
      // 断开与重连由浏览器 EventSource 自愈，连接状态一律由轮询判定，
      // 避免事件流静默（如后端心跳死锁）被误判为服务不可用。
      let missedEvents = false;
      let connection;
      const eventHandler = (event) => {
        if (this._dataConnection !== connection) {
          return;
        }
        if (event === "error" || event === "close") {
          // 只记录发生过断开，供重连后补取快照；不改判连接状态。
          missedEvents = true;
          return;
        }
        if (event.event === "process_changed") {
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
        // 断开后重新 open：补一次快照，弥补断开期间丢失的事件。
        if (missedEvents) {
          missedEvents = false;
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
          // HTTP 成功即证明服务端可达（connected 由服务端往返成败判定）。
          this.connected = true;
          if (this.error === MULTIVISOR_CONNECTION_ERROR) {
            this.setError("");
          }
        } catch {
          if (generation !== this._dataGeneration) {
            return;
          }
          if (this.lastDataUpdate === null) {
            this.dataStatus = "error";
          }
          this.connected = false;
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
      this._stopPolling();
      this.connected = false;
      this.refreshing = false;
      if (this.dataStatus === "loading") {
        this.dataStatus = "idle";
      }
      connection?.close();
    },
    _startPolling() {
      if (this._pollTimer === null) {
        this._schedulePoll();
      }
      if (!this._visibilityHandler) {
        const handler = () => {
          // 页签隐藏期间轮询空转；回到可见立即补一次，不等下个周期。
          if (!document.hidden && this._pollTimer !== null) {
            this._pollServer(this._dataGeneration);
          }
        };
        this._visibilityHandler = markRaw(handler);
        document.addEventListener("visibilitychange", handler);
      }
    },
    _schedulePoll() {
      if (this._pollTimer !== null) {
        return;
      }
      // 包一层对象再 markRaw：浏览器的定时器句柄是数字，直接 markRaw 会抛错。
      const handle = {};
      handle.id = setTimeout(() => {
        if (this._pollTimer === handle) {
          this._pollTimer = null;
          this._pollTick();
        }
      }, POLL_INTERVAL_MS);
      this._pollTimer = markRaw(handle);
    },
    _stopPolling() {
      if (this._pollTimer !== null) {
        clearTimeout(this._pollTimer.id);
        this._pollTimer = null;
      }
      if (this._visibilityHandler) {
        document.removeEventListener(
          "visibilitychange",
          this._visibilityHandler,
        );
        this._visibilityHandler = null;
      }
    },
    async _pollTick() {
      const generation = this._dataGeneration;
      try {
        if (!document.hidden) {
          await this._pollServer(generation);
        }
      } finally {
        // 链式调度：上一轮结束后才排下一轮，天然避免请求重叠。
        if (generation === this._dataGeneration) {
          this._schedulePoll();
        }
      }
    },
    async _pollServer(generation) {
      let response = null;
      try {
        response = await api.refreshData(POLL_TIMEOUT_MS);
      } catch {
        // 超时或网络失败：视为服务不可达。
      }
      if (generation !== this._dataGeneration) {
        return;
      }
      if (response && response.status === 401) {
        this.handleUnauthorized();
        return;
      }
      if (!response || !response.ok) {
        this.connected = false;
        this.setMultivisorError();
        return;
      }
      let snapshot = null;
      try {
        snapshot = await response.json();
      } catch {
        // 响应体异常同样视为不可达。
      }
      if (generation !== this._dataGeneration) {
        return;
      }
      if (snapshot === null) {
        this.connected = false;
        this.setMultivisorError();
        return;
      }
      this.updateMultivisor(snapshot);
      this.dataStatus = "ready";
      this.connected = true;
      if (this.error === MULTIVISOR_CONNECTION_ERROR) {
        this.setError("");
      }
      // 首载失败后由轮询恢复时，补建事件流。
      if (!this._dataConnection) {
        this._connectStream();
      }
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
