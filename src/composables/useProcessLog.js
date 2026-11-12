import { onScopeDispose, ref, toValue, watch } from "vue";

export const MAX_LOG_LENGTH = 1e7;
export const TRIMMED_LOG_LENGTH = 9000000;

function decodeLogMessage(rawMessage) {
  let data;
  try {
    data = JSON.parse(rawMessage);
  } catch {
    return { error: "invalid-log-message" };
  }
  if (!data || typeof data.size !== "number" || Number.isNaN(data.size)) {
    return { error: "invalid-log-message" };
  }
  const result = { size: data.size };
  if (data.message === undefined || data.message === null) {
    return result;
  }
  if (typeof data.message !== "string") {
    return { error: "invalid-log-message" };
  }
  result.message = data.message;
  return result;
}

export function useProcessLog({ uid, stream, active }) {
  const text = ref("");
  const remoteSize = ref(0);
  const localSize = ref(0);
  const error = ref("");
  const connected = ref(false);
  const autoScroll = ref(true);

  let currentSource = null;

  function updateLocalSize(value) {
    localSize.value = new TextEncoder().encode(value).length;
  }

  function appendLogMessage(result) {
    if (result.error) {
      error.value = result.error;
      return;
    }
    error.value = "";
    remoteSize.value = result.size;
    if (result.message === undefined) {
      return;
    }
    text.value += result.message;
    // 复用旧日志组件的显示上限；原实现因访问 text 而不是 text.value 从未生效。
    if (text.value.length > MAX_LOG_LENGTH) {
      text.value = text.value.slice(-TRIMMED_LOG_LENGTH);
    }
    updateLocalSize(text.value);
  }

  function closeCurrentSource() {
    const source = currentSource;
    currentSource = null;
    connected.value = false;
    if (source) {
      source.close();
    }
  }

  function openLogStream() {
    closeCurrentSource();
    text.value = "";
    remoteSize.value = 0;
    localSize.value = 0;
    error.value = "";
    connected.value = false;

    const source = new EventSource(
      `/api/process/log/${toValue(stream)}/tail/${encodeURIComponent(toValue(uid))}`,
    );
    source.onopen = () => {
      if (currentSource !== source) {
        return;
      }
      error.value = "";
      connected.value = true;
    };
    source.onmessage = (event) => {
      if (currentSource !== source) {
        return;
      }
      const result = decodeLogMessage(event.data);
      appendLogMessage(result);
    };
    source.onerror = () => {
      if (currentSource !== source) {
        return;
      }
      error.value = "log-stream-failed";
      connected.value = false;
    };
    source.onclose = () => {
      if (currentSource !== source) {
        return;
      }
      connected.value = false;
    };
    currentSource = source;
  }

  watch(
    [uid, stream, active],
    ([nextUid, nextStream, nextActive]) => {
      if (!nextActive || !nextUid || !nextStream) {
        closeCurrentSource();
        text.value = "";
        remoteSize.value = 0;
        localSize.value = 0;
        error.value = "";
        connected.value = false;
        return;
      }
      openLogStream();
    },
    { immediate: true, flush: "sync" },
  );

  onScopeDispose(closeCurrentSource);

  function clearDisplay() {
    text.value = "";
    updateLocalSize("");
  }

  return {
    text,
    remoteSize,
    localSize,
    error,
    connected,
    autoScroll,
    clearDisplay,
  };
}
