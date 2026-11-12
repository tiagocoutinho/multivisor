import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import * as api from "@/api";
import {
  MULTIVISOR_CONNECTION_ERROR,
  useAppStore,
} from "@/stores/app";
import { useInspectorStore } from "@/stores/inspector";

vi.mock("@/api", () => ({
  processAction: vi.fn(),
  supervisorAction: vi.fn(),
  adminReload: vi.fn(),
  load: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/stores/inspector", () => ({
  useInspectorStore: vi.fn(),
}));

function process(name, overrides = {}) {
  return {
    uid: `n:g:${name}`,
    name,
    group: "g",
    supervisor: "n",
    statename: "RUNNING",
    running: true,
    ...overrides,
  };
}

function snapshot(names, node = { name: "n", running: true }) {
  const processes = Object.fromEntries(
    names.map((name) => [process(name).uid, process(name)]),
  );
  return {
    name: "cluster",
    supervisors: {
      [node.name]: {
        name: node.name,
        running: node.running,
        processes,
      },
    },
  };
}

function configureInspector() {
  const inspector = { close: vi.fn() };
  useInspectorStore.mockReturnValue(inspector);
  return inspector;
}

function readyStore(names = ["a"]) {
  configureInspector();
  const store = useAppStore();
  store.updateMultivisor(snapshot(names));
  store.dataStatus = "ready";
  store.connected = true;
  return store;
}

describe("真实操作提交与集中确认", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it("逐个 UID 提交，HTTP 接受后移除选择且不改变进程数据", async () => {
    const store = readyStore(["a", "b", "c"]);
    const original = store.multivisor;
    store.setSelectedProcesses(["n:g:a", "n:g:b", "n:g:c"]);
    api.processAction.mockResolvedValue({ ok: true, status: 200 });

    const results = await store.runProcessAction(
      ["n:g:a", "n:g:b", "n:g:c"],
      "restart",
    );

    expect(api.processAction.mock.calls).toEqual([
      ["n:g:a", "restart"],
      ["n:g:b", "restart"],
      ["n:g:c", "restart"],
    ]);
    expect(results).toEqual([
      {
        uid: "n:g:a",
        name: "a",
        supervisor: "n",
        kind: "process",
        action: "restart",
        requestState: "accepted",
        httpStatus: 200,
      },
      {
        uid: "n:g:b",
        name: "b",
        supervisor: "n",
        kind: "process",
        action: "restart",
        requestState: "accepted",
        httpStatus: 200,
      },
      {
        uid: "n:g:c",
        name: "c",
        supervisor: "n",
        kind: "process",
        action: "restart",
        requestState: "accepted",
        httpStatus: 200,
      },
    ]);
    expect(store.operationResults).toEqual(results);
    expect(store.pendingProcessUids).toEqual([]);
    expect(store.selectedProcesses).toEqual([]);
    expect(store.multivisor).toEqual(original);
  });

  it("网络失败逐项标记失败并保留选择", async () => {
    const store = readyStore(["a"]);
    store.setSelectedProcesses(["n:g:a"]);
    api.processAction.mockRejectedValue(new TypeError("network down"));

    const results = await store.runProcessAction(["n:g:a"], "stop");

    expect(results[0]).toMatchObject({
      uid: "n:g:a",
      name: "a",
      supervisor: "n",
      action: "stop",
      kind: "process",
      requestState: "failed",
    });
    expect(results[0].httpStatus).toBeUndefined();
    expect(store.selectedProcesses).toEqual(["n:g:a"]);
    expect(store.pendingProcessUids).toEqual([]);
  });

  it("HTTP 500 记录失败，401 终止后续目标并释放数据连接", async () => {
    const store = readyStore(["a", "b", "c"]);
    const inspector = configureInspector();
    store.setSelectedProcesses(["n:g:a", "n:g:b", "n:g:c"]);
    api.processAction
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    const results = await store.runProcessAction(
      ["n:g:a", "n:g:b", "n:g:c"],
      "restart",
    );

    expect(api.processAction).toHaveBeenCalledTimes(2);
    expect(results.map((item) => item.requestState)).toEqual([
      "failed",
      "failed",
      "not-submitted",
    ]);
    expect(results[0].httpStatus).toBe(500);
    expect(results[1].httpStatus).toBe(401);
    expect(results[2].httpStatus).toBeUndefined();
    expect(store.selectedProcesses).toEqual(["n:g:a", "n:g:b", "n:g:c"]);
    expect(store.connected).toBe(false);
    expect(store.dataStatus).toBe("ready");
    expect(inspector.close).toHaveBeenCalledTimes(1);
    expect(store.isAuthenticated).toBe(false);
    expect(api.logout).not.toHaveBeenCalled();
  });

  it("同一 UID 提交期间并发动作调用直接返回空结果", async () => {
    const store = readyStore(["a"]);
    let resolveRequest;
    api.processAction.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = store.runProcessAction(["n:g:a"], "restart");
    expect(store.pendingProcessUids).toEqual(["n:g:a"]);

    const second = await store.runProcessAction(["n:g:a"], "restart");
    resolveRequest({ ok: true, status: 202 });
    await first;

    expect(api.processAction).toHaveBeenCalledTimes(1);
    expect(second).toEqual([]);
  });

  it("离线节点、数据未就绪、目标消失或连接断开时不发请求", async () => {
    const store = readyStore(["a"]);
    store.selectedProcesses = ["n:g:a"];

    let results = await store.runSupervisorAction("missing", "restart");
    expect(results[0]).toMatchObject({
      name: "missing",
      supervisor: "missing",
      kind: "supervisor",
      action: "restart",
      requestState: "not-submitted",
    });
    expect(api.supervisorAction).not.toHaveBeenCalled();

    await store.updateMultivisor(
      snapshot([], { name: "offline", running: false }),
    );
    results = await store.runSupervisorAction("offline", "update");
    expect(api.supervisorAction).not.toHaveBeenCalled();
    expect(results[0].requestState).toBe("not-submitted");

    store.updateMultivisor(snapshot(["a"]));
    store.dataStatus = "loading";
    results = await store.runProcessAction(["n:g:a"], "start");
    expect(api.processAction).not.toHaveBeenCalled();
    expect(results[0].requestState).toBe("not-submitted");

    store.dataStatus = "ready";
    store.connected = false;
    results = await store.runProcessAction(["n:g:a"], "start");
    expect(api.processAction).not.toHaveBeenCalled();
    expect(results[0].requestState).toBe("not-submitted");
    expect(store.selectedProcesses).toEqual(["n:g:a"]);

    store.connected = true;
    results = await store.runProcessAction(["n:g:missing"], "start");
    expect(api.processAction).not.toHaveBeenCalled();
    expect(results[0].requestState).toBe("not-submitted");
    expect(results[0].uid).toBe("n:g:missing");
  });

  it("请求只打开集中确认，取消保留选择且不发请求", () => {
    const store = readyStore(["a", "b"]);
    store.setSelectedProcesses(["n:g:a", "n:g:b"]);

    store.requestProcessAction(["n:g:a", "n:g:b"], "stop");
    expect(store.confirmation).toEqual({
      kind: "process",
      uids: ["n:g:a", "n:g:b"],
      action: "stop",
    });
    expect(api.processAction).not.toHaveBeenCalled();

    store.cancelConfirmation();
    expect(store.confirmation).toBeNull();
    expect(store.selectedProcesses).toEqual(["n:g:a", "n:g:b"]);

    store.requestSupervisorAction("n", "update");
    expect(store.confirmation).toEqual({
      kind: "supervisor",
      name: "n",
      action: "update",
    });
    expect(api.supervisorAction).not.toHaveBeenCalled();
  });

  it("旧公共动作改为打开确认且不提前清空选择", () => {
    const store = readyStore(["a", "b"]);
    store.setSelectedProcesses(["n:g:a", "n:g:b"]);

    store.restartProcesses(["n:g:a"]);
    store.stopProcesses(["n:g:b"]);
    store.restartSelected();
    store.stopSelected();
    store.requestSupervisorUpdate("n");
    store.restartSupervisor("n");

    expect(api.processAction).not.toHaveBeenCalled();
    expect(api.supervisorAction).not.toHaveBeenCalled();
    expect(store.confirmation).toEqual({
      kind: "supervisor",
      name: "n",
      action: "restart",
    });
    expect(store.selectedProcesses).toEqual(["n:g:a", "n:g:b"]);
  });

  it("确认后提交并在成功时关闭确认，期间重复确认被忽略", async () => {
    const store = readyStore(["a"]);
    store.requestProcessAction(["n:g:a"], "restart");
    store.confirming = true;
    await store.confirmOperation();

    expect(store.confirming).toBe(true);
    expect(store.confirmation).not.toBeNull();
    expect(api.processAction).not.toHaveBeenCalled();

    configureInspector();
    store.confirming = false;
    api.processAction.mockResolvedValue({ ok: true, status: 200 });
    await store.confirmOperation();

    expect(api.processAction).toHaveBeenCalledWith("n:g:a", "restart");
    expect(store.confirmation).toBeNull();
    expect(store.confirming).toBe(false);
  });

  it("确认对象打开后目标消失，确认会生成未提交结果且关闭确认", async () => {
    const store = readyStore(["a"]);
    store.requestProcessAction(["n:g:a"], "restart");
    store.updateMultivisor(snapshot(["b"]));
    store.dataStatus = "ready";
    store.connected = true;

    await store.confirmOperation();

    expect(api.processAction).not.toHaveBeenCalled();
    expect(store.operationResults[0]).toMatchObject({
      uid: "n:g:a",
      requestState: "not-submitted",
    });
    expect(store.confirmation).toBeNull();
    expect(store.confirming).toBe(false);
  });

  it("关闭认证时，即使 isAuthenticated 为 false 也允许真实提交", async () => {
    const store = readyStore(["a"]);
    store.setUseAuthentication(false);
    store.setIsAuthenticated(false);
    api.processAction.mockResolvedValue({ ok: true, status: 202 });
    api.supervisorAction.mockResolvedValue({ ok: true, status: 200 });

    const processResults = await store.runProcessAction(["n:g:a"], "restart");
    const nodeResults = await store.runSupervisorAction("n", "update");

    expect(processResults[0].requestState).toBe("accepted");
    expect(nodeResults[0].requestState).toBe("accepted");
    expect(api.processAction).toHaveBeenCalledWith("n:g:a", "restart");
    expect(api.supervisorAction).toHaveBeenCalledWith("n", "update");
  });

  it("部分请求接受时，只移除已接受项，失败及未提交项保留", async () => {
    const store = readyStore(["a", "b", "c"]);
    store.setSelectedProcesses(["n:g:a", "n:g:b", "n:g:c"]);
    api.processAction
      .mockResolvedValueOnce({ ok: true, status: 202 })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    delete store.multivisor.supervisors.n.processes["n:g:c"];

    const results = await store.runProcessAction(
      store.selectedProcesses,
      "restart",
    );

    expect(results.map((item) => item.requestState)).toEqual([
      "accepted",
      "failed",
      "not-submitted",
    ]);
    expect(store.selectedProcesses).toEqual(["n:g:b", "n:g:c"]);
    expect(api.processAction).toHaveBeenCalledTimes(2);
  });

  it("确认时任一目标已消失，为全部目标保留未提交记录", async () => {
    const store = readyStore(["a", "b"]);
    store.requestProcessAction(["n:g:a", "n:g:b"], "restart");
    delete store.multivisor.supervisors.n.processes["n:g:b"];

    await store.confirmOperation();

    expect(store.operationResults.map((result) => result.uid)).toEqual([
      "n:g:a",
      "n:g:b",
    ]);
    expect(
      store.operationResults.every(
        (result) => result.requestState === "not-submitted",
      ),
    ).toBe(true);
    expect(api.processAction).not.toHaveBeenCalled();
    expect(store.confirmation).toBeNull();
  });

  it("操作已不再适用或动作不在接口约定内时不发请求", async () => {
    const store = readyStore(["a"]);
    expect(
      (await store.runProcessAction(["n:g:a"], "start"))[0].requestState,
    ).toBe("not-submitted");
    store.multivisor.supervisors.n.processes["n:g:a"].running = false;
    expect(
      (await store.runProcessAction(["n:g:a"], "stop"))[0].requestState,
    ).toBe("not-submitted");
    expect(
      (await store.runProcessAction(["n:g:a"], "invalid"))[0].requestState,
    ).toBe("not-submitted");
    expect(
      (await store.runSupervisorAction("n", "invalid"))[0].requestState,
    ).toBe("not-submitted");
    expect(api.processAction).not.toHaveBeenCalled();
    expect(api.supervisorAction).not.toHaveBeenCalled();
  });

  it("旧操作在退出后返回401，不会注销新会话或恢复旧确认框", async () => {
    const store = readyStore(["a"]);
    store.setUseAuthentication(true);
    store.setIsAuthenticated(true);
    let resolveRequest;
    api.processAction.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    store.requestProcessAction(["n:g:a"], "restart");
    const operation = store.confirmOperation();
    store.logout();
    store.setIsAuthenticated(true);
    resolveRequest({ ok: false, status: 401 });

    await operation;

    expect(store.isAuthenticated).toBe(true);
    expect(store.confirmation).toBeNull();
    expect(store.operationResults).toEqual([]);
    expect(store.pendingProcessUids).toEqual([]);
    expect(store.confirming).toBe(false);
  });
});

describe("手动复活事件流", () => {
  it("重建成功后立即补拉一次快照", async () => {
    const store = readyStore(["a"]);
    api.adminReload.mockResolvedValue({ ok: true, status: 200 });
    api.load.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => snapshot(["a", "b"]),
    });

    await expect(store.reviveEventStream()).resolves.toBe(true);

    expect(api.adminReload).toHaveBeenCalledTimes(1);
    expect(api.load).toHaveBeenCalledTimes(1);
    expect(store.error).toBe("");
  });

  it.each([
    ["HTTP 500", () => api.adminReload.mockResolvedValue({ ok: false, status: 500 })],
    ["网络失败", () => api.adminReload.mockRejectedValue(new TypeError("Failed to fetch"))],
  ])("%s 时不刷新数据并标记连接错误", async (_, setup) => {
    const store = readyStore(["a"]);
    setup();

    await expect(store.reviveEventStream()).resolves.toBe(false);

    expect(api.load).not.toHaveBeenCalled();
    expect(store.error).toBe(MULTIVISOR_CONNECTION_ERROR);
  });

  it("收到 401 时按未认证处理", async () => {
    const store = readyStore(["a"]);
    store.setUseAuthentication(true);
    store.setIsAuthenticated(true);
    api.adminReload.mockResolvedValue({ ok: false, status: 401 });

    await expect(store.reviveEventStream()).resolves.toBe(false);

    expect(store.isAuthenticated).toBe(false);
    expect(api.load).not.toHaveBeenCalled();
  });
});
