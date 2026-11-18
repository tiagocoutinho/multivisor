import { afterEach, describe, expect, test, vi } from "vitest";
import { computed, effectScope, ref } from "vue";

import { useProcessLog } from "./useProcessLog";

class MockEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.closed = false;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    MockEventSource.instances.push(this);
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  message(data) {
    this.onmessage?.({ data });
  }

  error() {
    this.readyState = 2;
    this.onerror?.();
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.readyState = 2;
    this.onclose?.();
  }

  get currentMessageCount() {
    return this.messageCount ?? 0;
  }
}

async function createLog(options) {
  const scope = effectScope();
  const log = scope.run(() => useProcessLog(options));
  const source = MockEventSource.instances[0];
  source.open();
  await vi.waitFor(() => {
    expect(log.connected.value).toBe(true);
  });
  return { scope, log };
}

describe("real process log stream", () => {
  afterEach(() => {
    MockEventSource.instances = [];
    vi.unstubAllGlobals();
  });

  test("opens one UTF-8-byte-counting connection for an active stream", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("node:core:中文"),
      stream: ref("out"),
      active: computed(() => true),
    });
    const source = MockEventSource.instances[0];

    expect(source.url).toBe(
      "/api/process/log/out/tail/node%3Acore%3A%E4%B8%AD%E6%96%87",
    );
    expect(log.autoScroll.value).toBe(true);
    expect(log.localSize.value).toBe(0);

    source.open();
    source.message(JSON.stringify({ size: 24, message: "中文\n" }));
    expect(log.text.value).toBe("中文\n");
    expect(log.localSize.value).toBe(7);
    expect(log.remoteSize.value).toBe(24);
    expect(log.error.value).toBe("");

    scope.stop();
  });

  test("accepts size-only updates without corrupting text", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("err"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    source.open();
    source.message(JSON.stringify({ size: 1024, message: "first\n" }));
    source.message(JSON.stringify({ size: 2048 }));
    expect(log.text.value).toBe("first\n");
    expect(log.remoteSize.value).toBe(2048);
    expect(log.error.value).toBe("");

    scope.stop();
  });

  test("reports invalid JSON as the current stream error", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    source.open();
    source.message("{not-json}");
    expect(log.error.value).toContain("invalid");
    expect(log.text.value).toBe("");
    expect(log.remoteSize.value).toBe(0);

    scope.stop();
  });

  test("clears stale errors when reconnect opens or valid data arrives", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    source.error();
    expect(log.error.value).toBe("log-stream-failed");
    expect(log.connected.value).toBe(false);

    source.open();
    expect(log.error.value).toBe("");
    expect(log.connected.value).toBe(true);

    source.message("{not-json}");
    expect(log.error.value).toBe("invalid-log-message");

    source.message(JSON.stringify({ size: 4, message: "ok\n" }));
    expect(log.error.value).toBe("");
    expect(log.text.value).toBe("ok\n");

    scope.stop();
  });

  test("reports disconnected after the current source is closed", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    expect(log.connected.value).toBe(true);
    source.close();
    expect(log.connected.value).toBe(false);

    scope.stop();
  });

  test("closes and resets when uid or stream changes", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const uid = ref("one");
    const stream = ref("out");
    const { scope, log } = await createLog({
      uid,
      stream,
      active: ref(true),
    });
    const first = MockEventSource.instances[0];

    first.open();
    first.message(JSON.stringify({ size: 8, message: "one\n" }));
    uid.value = "two";
    await vi.waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(2);
    });

    expect(first.closed).toBe(true);
    expect(log.text.value).toBe("");
    expect(log.remoteSize.value).toBe(0);
    expect(log.error.value).toBe("");
    expect(MockEventSource.instances[1].url).toBe(
      "/api/process/log/out/tail/two",
    );

    stream.value = "err";
    await vi.waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(3);
    });
    expect(MockEventSource.instances[1].closed).toBe(true);
    expect(MockEventSource.instances[2].url).toBe(
      "/api/process/log/err/tail/two",
    );

    scope.stop();
    expect(MockEventSource.instances[2].closed).toBe(true);
  });

  test("closes immediately when the panel becomes inactive", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const active = ref(true);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active,
    });
    const source = MockEventSource.instances[0];

    source.open();
    source.message(JSON.stringify({ size: 5, message: "one\n" }));
    active.value = false;

    expect(source.closed).toBe(true);
    expect(log.connected.value).toBe(false);
    expect(log.text.value).toBe("");
    expect(log.remoteSize.value).toBe(0);

    scope.stop();
  });

  test("ignores late messages from a replaced connection", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const uid = ref("one");
    const { scope, log } = await createLog({
      uid,
      stream: ref("out"),
      active: ref(true),
    });
    const first = MockEventSource.instances[0];

    first.open();
    first.message(JSON.stringify({ size: 4, message: "one\n" }));
    uid.value = "two";
    const second = MockEventSource.instances[1];

    first.message(JSON.stringify({ size: 9, message: "late\n" }));
    expect(log.text.value).toBe("");
    expect(log.remoteSize.value).toBe(0);

    second.open();
    second.message(JSON.stringify({ size: 8, message: "two\n" }));
    expect(log.text.value).toBe("two\n");
    expect(log.remoteSize.value).toBe(8);

    scope.stop();
  });

  test("clears browser display only and preserves remote size", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    source.open();
    source.message(JSON.stringify({ size: 9, message: "one\n" }));
    log.clearDisplay();
    expect(log.text.value).toBe("");
    expect(log.localSize.value).toBe(0);
    expect(log.remoteSize.value).toBe(9);
    expect(source.closed).toBe(false);

    scope.stop();
  });

  test("trims oversized UTF-16 text while retaining the tail", async () => {
    vi.stubGlobal("EventSource", MockEventSource);
    const { scope, log } = await createLog({
      uid: ref("one"),
      stream: ref("out"),
      active: ref(true),
    });
    const source = MockEventSource.instances[0];

    source.open();
    const tailLength = 9000000;
    const oversizedLength = 10000001;
    source.message(
      JSON.stringify({
        size: oversizedLength,
        message: "x".repeat(oversizedLength),
      }),
    );

    expect(log.text.value).toHaveLength(tailLength);
    expect(log.text.value.at(-1)).toBe("x");
    expect(log.localSize.value).toBe(tailLength);

    scope.stop();
  });
});
