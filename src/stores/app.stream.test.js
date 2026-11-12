import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import * as api from "@/api";
import { MULTIVISOR_CONNECTION_ERROR, useAppStore } from "@/stores/app";

vi.mock("@/api", () => ({
  load: vi.fn(),
  streamTo: vi.fn(),
  logout: vi.fn(),
}));

function snapshot(name = "cluster") {
  return {
    name,
    supervisors: {
      node: {
        name: "node",
        running: true,
        processes: {
          "node:worker": {
            uid: "node:worker",
            name: "worker",
            group: "workers",
            supervisor: "node",
            statename: "RUNNING",
            running: true,
          },
        },
      },
    },
  };
}

function response(data = snapshot()) {
  return { ok: true, status: 200, json: async () => data };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function open(stream) {
  expect(stream.onopen).toBeTypeOf("function");
  stream.onopen();
}

describe("应用数据与事件连接的生命周期", () => {
  let store;
  let streams;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    setActivePinia(createPinia());
    store = useAppStore();
    streams = [];
    api.load.mockResolvedValue(response());
    api.streamTo.mockImplementation((receive) => {
      const stream = { receive, onopen: null, close: vi.fn() };
      streams.push(stream);
      return stream;
    });
  });

  afterEach(() => {
    store.disposeDataConnection?.();
    vi.useRealTimers();
  });

  it("先应用首份快照，再由流的 open 事件确认连接，不重复请求数据", async () => {
    expect(store.dataStatus).toBe("idle");
    expect(store.connected).toBe(false);
    expect(store.lastDataUpdate).toBeNull();
    const pending = deferred();
    api.load.mockReturnValueOnce(pending.promise);

    const initialization = store.init();

    expect(store.dataStatus).toBe("loading");
    expect(store.refreshing).toBe(false);
    expect(api.streamTo).not.toHaveBeenCalled();
    pending.resolve(response());
    await initialization;

    expect(store.multivisor).toEqual(snapshot());
    expect(store.dataStatus).toBe("ready");
    expect(store.lastDataUpdate).toBe(1000);
    expect(store.connected).toBe(false);
    expect(api.streamTo).toHaveBeenCalledTimes(1);

    open(streams[0]);

    expect(store.connected).toBe(true);
    expect(api.load).toHaveBeenCalledTimes(1);
  });

  it("同时和先后重复初始化都不重复请求或建立连接", async () => {
    const pending = deferred();
    api.load.mockReturnValueOnce(pending.promise);

    const first = store.init();
    const second = store.init();
    expect(api.load).toHaveBeenCalledTimes(1);
    pending.resolve(response());
    await Promise.all([first, second]);
    await store.init();

    expect(api.load).toHaveBeenCalledTimes(1);
    expect(streams).toHaveLength(1);
  });

  it("手动刷新只替换快照及更新时间，保留唯一事件连接", async () => {
    await store.init();
    open(streams[0]);
    vi.setSystemTime(2000);
    api.load.mockResolvedValueOnce(response(snapshot("refreshed")));

    await store.refresh();

    expect(store.multivisor.name).toBe("refreshed");
    expect(store.lastDataUpdate).toBe(2000);
    expect(store.dataStatus).toBe("ready");
    expect(store.refreshing).toBe(false);
    expect(store.connected).toBe(true);
    expect(streams).toHaveLength(1);
    expect(streams[0].close).not.toHaveBeenCalled();
  });

  it("刷新进行中合并重复请求，并保持已有数据可用", async () => {
    await store.init();
    const pending = deferred();
    api.load.mockReturnValueOnce(pending.promise);

    const first = store.refresh();
    const second = store.refresh();

    expect(store.refreshing).toBe(true);
    expect(store.dataStatus).toBe("ready");
    expect(store.multivisor).toEqual(snapshot());
    expect(api.load).toHaveBeenCalledTimes(2);
    pending.resolve(response(snapshot("latest")));
    await Promise.all([first, second]);
    expect(store.multivisor.name).toBe("latest");
    expect(store.refreshing).toBe(false);
    expect(streams).toHaveLength(1);
  });

  it("首载 401 设置未认证状态，不建立数据流，并允许登录后重新初始化", async () => {
    store.setUseAuthentication(true);
    store.setIsAuthenticated(true);
    api.load.mockResolvedValueOnce({ ok: false, status: 401 });

    await store.init();

    expect(store.isAuthenticated).toBe(false);
    expect(store.dataStatus).toBe("idle");
    expect(store.connected).toBe(false);
    expect(store.lastDataUpdate).toBeNull();
    expect(api.streamTo).not.toHaveBeenCalled();

    store.setIsAuthenticated(true);
    await store.init();
    expect(store.dataStatus).toBe("ready");
    expect(streams).toHaveLength(1);
  });

  const failures = [
    ["网络失败", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["HTTP 500", () => Promise.resolve({ ok: false, status: 500 })],
    ["HTTP 504", () => Promise.resolve({ ok: false, status: 504 })],
    [
      "无效 JSON",
      () =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        }),
    ],
  ];

  it.each(failures)(
    "首载%s进入失败状态，重试成功后清除错误",
    async (_, fail) => {
      api.load.mockImplementationOnce(fail);

      await store.init();

      expect(store.dataStatus).toBe("error");
      expect(store.loadError).toBe(MULTIVISOR_CONNECTION_ERROR);
      expect(store.error).toBe(MULTIVISOR_CONNECTION_ERROR);
      expect(store.connected).toBe(false);
      expect(store.lastDataUpdate).toBeNull();
      expect(api.streamTo).not.toHaveBeenCalled();

      await store.init();

      expect(store.dataStatus).toBe("ready");
      expect(store.loadError).toBe("");
      expect(store.error).toBe("");
      expect(streams).toHaveLength(1);
    },
  );

  it.each(["error", "close"])(
    "%s 只标记断连，保留快照及真实更新时间",
    async (event) => {
      await store.init();
      open(streams[0]);
      vi.setSystemTime(2000);

      streams[0].receive(event);

      expect(store.connected).toBe(false);
      expect(store.multivisor).toEqual(snapshot());
      expect(store.dataStatus).toBe("ready");
      expect(store.lastDataUpdate).toBe(1000);
      expect(store.error).toBe(MULTIVISOR_CONNECTION_ERROR);
      expect(streams[0].close).not.toHaveBeenCalled();
    },
  );

  it("每次断连后重新 open 补取一次快照，连续 open 不重复刷新", async () => {
    await store.init();
    const stream = streams[0];
    open(stream);
    stream.receive("error");
    const pending = deferred();
    api.load.mockReturnValueOnce(pending.promise);

    open(stream);
    open(stream);

    expect(store.connected).toBe(true);
    expect(store.refreshing).toBe(true);
    expect(api.load).toHaveBeenCalledTimes(2);
    vi.setSystemTime(2000);
    pending.resolve(response(snapshot("reconnected")));
    await store.refresh();
    expect(store.multivisor.name).toBe("reconnected");
    expect(store.lastDataUpdate).toBe(2000);

    stream.receive("close");
    open(stream);
    await store.refresh();
    expect(api.load).toHaveBeenCalledTimes(3);
    expect(streams).toHaveLength(1);
    expect(store.error).toBe("");
  });

  it.each(failures)(
    "已有快照刷新%s时保留数据，后续刷新可以恢复",
    async (_, fail) => {
      await store.init();
      open(streams[0]);
      vi.setSystemTime(2000);
      api.load.mockImplementationOnce(fail);

      await store.refresh();

      expect(store.multivisor).toEqual(snapshot());
      expect(store.dataStatus).toBe("ready");
      expect(store.lastDataUpdate).toBe(1000);
      expect(store.refreshing).toBe(false);
      expect(store.loadError).toBe(MULTIVISOR_CONNECTION_ERROR);
      expect(store.error).toBe(MULTIVISOR_CONNECTION_ERROR);
      expect(store.connected).toBe(true);

      await store.refresh();

      expect(store.lastDataUpdate).toBe(2000);
      expect(store.loadError).toBe("");
      expect(store.error).toBe("");
      expect(streams).toHaveLength(1);
    },
  );

  it("断连时手动取得快照也不伪造连接恢复", async () => {
    await store.init();
    open(streams[0]);
    streams[0].receive("error");
    vi.setSystemTime(2000);

    await store.refresh();

    expect(store.lastDataUpdate).toBe(2000);
    expect(store.connected).toBe(false);
    expect(store.error).toBe(MULTIVISOR_CONNECTION_ERROR);
    open(streams[0]);
    await store.refresh();
    expect(store.error).toBe("");
  });

  it("成功加载和重新连接不清除其他功能设置的错误", async () => {
    await store.init();
    store.setError("其他操作失败");
    open(streams[0]);
    await store.refresh();

    expect(store.error).toBe("其他操作失败");
  });

  it("进程与节点事件更新真实数据和时间，通知保持原职责", async () => {
    await store.init();
    const stream = streams[0];
    const process = {
      ...snapshot().supervisors.node.processes["node:worker"],
      statename: "STOPPED",
      running: false,
    };
    vi.setSystemTime(2000);
    stream.receive({ event: "process_changed", payload: process });

    expect(store.process("node:worker")).toEqual(process);
    expect(store.lastDataUpdate).toBe(2000);

    vi.setSystemTime(3000);
    const supervisor = { name: "node", running: false, processes: {} };
    stream.receive({ event: "supervisor_changed", payload: supervisor });

    expect(store.supervisor("node")).toEqual(supervisor);
    expect(store.processes).toEqual([]);
    expect(store.lastDataUpdate).toBe(3000);

    vi.setSystemTime(4000);
    const notification = { level: "INFO", message: "updated" };
    stream.receive({ event: "notification", payload: notification });
    stream.receive({ event: "unknown", payload: {} });

    expect(store.notifications).toEqual([notification]);
    expect(store.lastDataUpdate).toBe(3000);
  });

  it("释放连接后忽略旧连接的打开、断开和业务事件", async () => {
    await store.init();
    const stream = streams[0];
    open(stream);

    store.disposeDataConnection();
    store.disposeDataConnection();
    vi.setSystemTime(2000);
    open(stream);
    stream.receive("error");
    stream.receive("close");
    stream.receive({
      event: "supervisor_changed",
      payload: { name: "late", running: false, processes: {} },
    });
    stream.receive({
      event: "process_changed",
      payload: {
        ...snapshot().supervisors.node.processes["node:worker"],
        running: false,
      },
    });
    stream.receive({ event: "notification", payload: { message: "late" } });

    expect(stream.close).toHaveBeenCalledTimes(1);
    expect(store.connected).toBe(false);
    expect(store.multivisor).toEqual(snapshot());
    expect(store.notifications).toEqual([]);
    expect(store.lastDataUpdate).toBe(1000);
    expect(store.error).toBe("");
    expect(api.load).toHaveBeenCalledTimes(1);
  });

  it("建立替代连接后，旧连接回调不能改动新连接状态", async () => {
    await store.init();
    const old = streams[0];
    store.disposeDataConnection();
    api.load.mockResolvedValueOnce(response(snapshot("new-session")));
    await store.init();
    open(streams[1]);
    old.receive("error");
    old.receive({
      event: "supervisor_changed",
      payload: { name: "old", processes: {} },
    });
    open(old);

    expect(store.connected).toBe(true);
    expect(store.multivisor).toEqual(snapshot("new-session"));
    expect(store.error).toBe("");
    expect(api.load).toHaveBeenCalledTimes(2);
  });

  it("退出时释放连接，旧事件不再影响数据", async () => {
    store.setIsAuthenticated(true);
    await store.init();
    open(streams[0]);

    store.logout();
    streams[0].receive({ event: "notification", payload: { message: "late" } });

    expect(store.isAuthenticated).toBe(false);
    expect(store.connected).toBe(false);
    expect(streams[0].close).toHaveBeenCalledTimes(1);
    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(store.notifications).toEqual([]);
  });

  it("刷新 401 时取消认证并释放已有连接", async () => {
    store.setIsAuthenticated(true);
    await store.init();
    open(streams[0]);
    api.load.mockResolvedValueOnce({ ok: false, status: 401 });

    await store.refresh();
    open(streams[0]);

    expect(store.isAuthenticated).toBe(false);
    expect(store.connected).toBe(false);
    expect(store.refreshing).toBe(false);
    expect(streams[0].close).toHaveBeenCalledTimes(1);
    expect(streams).toHaveLength(1);
  });

  it("首载请求未结束时退出，晚到响应不恢复数据或创建连接", async () => {
    const pending = deferred();
    api.load.mockReturnValueOnce(pending.promise);
    const initialization = store.init();

    store.logout();
    pending.resolve(response(snapshot("late")));
    await initialization;

    expect(store.dataStatus).toBe("idle");
    expect(store.lastDataUpdate).toBeNull();
    expect(store.multivisor.name).toBe("Multivisor");
    expect(store.refreshing).toBe(false);
    expect(api.streamTo).not.toHaveBeenCalled();
  });

  it("读取响应正文时释放连接，也忽略晚到快照", async () => {
    const body = deferred();
    const json = vi.fn(() => body.promise);
    api.load.mockResolvedValueOnce({ ok: true, status: 200, json });
    const initialization = store.init();
    await Promise.resolve();
    expect(json).toHaveBeenCalledTimes(1);

    store.disposeDataConnection();
    body.resolve(snapshot("late-body"));
    await initialization;

    expect(store.dataStatus).toBe("idle");
    expect(store.lastDataUpdate).toBeNull();
    expect(api.streamTo).not.toHaveBeenCalled();
  });

  it("新会话加载期间收到旧请求结果，不覆盖数据或清除新的刷新状态", async () => {
    await store.init();
    const oldResponse = deferred();
    api.load.mockReturnValueOnce(oldResponse.promise);
    const oldRefresh = store.refresh();

    store.disposeDataConnection();
    const newResponse = deferred();
    api.load.mockReturnValueOnce(newResponse.promise);
    const newInitialization = store.init();
    oldResponse.resolve(response(snapshot("old")));
    await oldRefresh;

    expect(store.refreshing).toBe(true);
    expect(store.multivisor.name).toBe("cluster");
    newResponse.resolve(response(snapshot("new")));
    await newInitialization;

    expect(store.multivisor.name).toBe("new");
    expect(store.refreshing).toBe(false);
    expect(streams).toHaveLength(2);
    expect(streams[0].close).toHaveBeenCalledTimes(1);
  });
});
