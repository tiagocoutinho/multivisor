import { beforeEach, describe, expect, test } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useInspectorStore } from "./inspector";

describe("inspector store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("opens, switches tabs and retains the current height", () => {
    const inspector = useInspectorStore();

    expect(inspector.visible).toBe(false);
    inspector.height = 420;
    inspector.open("node:group:one", "out");

    expect(inspector.uid).toBe("node:group:one");
    expect(inspector.visible).toBe(true);
    expect(inspector.tab).toBe("out");
    expect(inspector.height).toBe(420);

    inspector.open("node:group:two", "err");
    expect(inspector.uid).toBe("node:group:two");
    expect(inspector.tab).toBe("err");
    expect(inspector.visible).toBe(true);
  });

  test("uses the details tab for unknown or unsupported tab values", () => {
    const inspector = useInspectorStore();

    inspector.open("node:group:one", "bad-tab");
    expect(inspector.tab).toBe("details");

    inspector.open("node:group:two");
    expect(inspector.tab).toBe("details");
  });

  test("closes without discarding the selected uid or order", () => {
    const inspector = useInspectorStore();
    inspector.open("node:group:one");
    inspector.setOrder(["node:group:one", "node:group:two"]);

    inspector.close();
    expect(inspector.visible).toBe(false);
    expect(inspector.uid).toBe("node:group:one");
    expect(inspector.orderedUids).toEqual(["node:group:one", "node:group:two"]);
  });

  test("steps inside the current order and stays on boundaries", () => {
    const inspector = useInspectorStore();
    inspector.setOrder(["one", "two", "three"]);
    inspector.open("two", "err");

    inspector.step(-1);
    expect(inspector.uid).toBe("one");
    expect(inspector.tab).toBe("err");
    expect(inspector.visible).toBe(true);

    inspector.step(-1);
    expect(inspector.uid).toBe("one");

    inspector.step(1);
    inspector.step(1);
    expect(inspector.uid).toBe("three");

    inspector.step(1);
    expect(inspector.uid).toBe("three");
  });

  test("does not navigate away when the current uid is outside the order", () => {
    const inspector = useInspectorStore();
    inspector.setOrder(["one", "two"]);
    inspector.open("outside", "details");

    inspector.step(-1);
    inspector.step(1);
    expect(inspector.uid).toBe("outside");
    expect(inspector.visible).toBe(true);
  });

  test("keeps only valid unique uids and preserves an absent current uid", () => {
    const inspector = useInspectorStore();
    inspector.setOrder(["one", "two", "one", ""]);
    expect(inspector.orderedUids).toEqual(["one", "two"]);

    inspector.open("two");
    inspector.setOrder(["three"]);
    expect(inspector.orderedUids).toEqual(["three"]);
    expect(inspector.uid).toBe("two");
  });
});
