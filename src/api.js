export const supervisorAction = (id, action) => {
  let form = new FormData();
  form.append("supervisor", id);
  return fetch("/api/supervisor/" + action, { method: "POST", body: form });
};

export const processAction = (uid, action) => {
  let form = new FormData();
  form.append("uid", uid);
  fetch("/api/process/" + action, { method: "POST", body: form });
};

export const load = () => {
  return fetch("/api/data");
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
