import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { usePreferencesStore } from "./preferences";

let storage;

beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  });
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("主题偏好", () => {
  test("没有保存偏好时默认使用深色", () => {
    expect(usePreferencesStore().themeName).toBe("dark");
  });

  test.each(["dark", "light"])("恢复已保存的 %s 主题", (theme) => {
    storage.set("multivisor-theme", theme);

    expect(usePreferencesStore().themeName).toBe(theme);
  });

  test.each(["", "LIGHT", "system", "invalid"])(
    "保存值 %j 无效时使用深色",
    (value) => {
      storage.set("multivisor-theme", value);

      expect(usePreferencesStore().themeName).toBe("dark");
    },
  );

  test.each([
    ["dark", "light"],
    ["light", "dark"],
  ])("将 %s 切换为 %s 并保存", (initial, expected) => {
    storage.set("multivisor-theme", initial);
    const preferences = usePreferencesStore();

    preferences.toggleTheme();

    expect(preferences.themeName).toBe(expected);
    expect(storage.get("multivisor-theme")).toBe(expected);
  });

  test("连续切换后恢复原主题并保存", () => {
    const preferences = usePreferencesStore();

    preferences.toggleTheme();
    preferences.toggleTheme();

    expect(preferences.themeName).toBe("dark");
    expect(storage.get("multivisor-theme")).toBe("dark");
  });

  test("重新创建应用状态后恢复切换结果", () => {
    usePreferencesStore().toggleTheme();
    setActivePinia(createPinia());

    expect(usePreferencesStore().themeName).toBe("light");
  });
});
