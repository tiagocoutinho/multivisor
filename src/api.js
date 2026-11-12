export const supervisorAction = (id, action) => {
  let form = new FormData();
  form.append("supervisor", id);
  return fetch("/api/supervisor/" + action, { method: "POST", body: form });
};

export const processAction = (uid, action) => {
  let form = new FormData();
  form.append("uid", uid);
  return fetch("/api/process/" + action, { method: "POST", body: form });
};

export const load = () => {
  return fetch("/api/data");
};

// /api/refresh 会让服务端向各 supervisor 节点发起一次 RPC 刷新并返回最新快照；
// 事件流异常（如心跳死锁）时依然可用，是前端轮询与健康判定的数据源。
export const refreshData = (timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch("/api/refresh", { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
};

export const streamTo = (eventHandler) => {
  let eventSource = new EventSource("/api/stream");
  eventSource.onmessage = (event) => {
    let data = JSON.parse(event.data);
    eventHandler(data);
  };
  eventSource.onerror = () => {
    eventHandler("error");
  };
  eventSource.onclose = () => {
    eventHandler("close");
  };
  return eventSource;
};

export const auth = () => {
  return fetch("/api/auth");
};

export const login = (form) => {
  return fetch("/api/login", { method: "POST", body: form });
};

export const logout = () => {
  return fetch("/api/logout", { method: "POST" });
};
