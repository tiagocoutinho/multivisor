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

describe("语言偏好", () => {
  test("没有保存偏好时默认使用中文词典", () => {
    const preferences = usePreferencesStore();

    expect(preferences.locale).toBe("zh");
    expect(preferences.labels.toLight).toBe("切换到浅色主题");
  });

  test.each(["zh", "en"])("恢复已保存的 %s 语言", (locale) => {
    storage.set("multivisor-lang", locale);

    expect(usePreferencesStore().locale).toBe(locale);
  });

  test.each(["", "ZH", "zh-CN", "english", "invalid"])(
    "保存值 %j 无效时使用中文",
    (value) => {
      storage.set("multivisor-lang", value);

      expect(usePreferencesStore().locale).toBe("zh");
    },
  );

  test.each([
    ["zh", "en"],
    ["en", "zh"],
  ])("将 %s 切换为 %s 并保存", (initial, expected) => {
    storage.set("multivisor-lang", initial);
    const preferences = usePreferencesStore();

    preferences.toggleLocale();

    expect(preferences.locale).toBe(expected);
    expect(storage.get("multivisor-lang")).toBe(expected);
  });

  test("切换语言后立即使用对应词典，往返切换恢复中文", () => {
    const preferences = usePreferencesStore();

    preferences.toggleLocale();

    expect(preferences.labels.toLight).toBe("Switch to light theme");
    expect(preferences.labels.selectionSummary(3, 2)).toBe(
      "3 selected across 2 nodes",
    );

    preferences.toggleLocale();

    expect(preferences.labels.toLight).toBe("切换到浅色主题");
    expect(preferences.labels.selectionSummary(3, 2)).toBe(
      "已选 3 个进程 · 来自 2 个节点",
    );
    expect(storage.get("multivisor-lang")).toBe("zh");
  });

  test("重新创建应用状态后恢复语言和对应词典", () => {
    usePreferencesStore().toggleLocale();
    setActivePinia(createPinia());

    const restored = usePreferencesStore();

    expect(restored.locale).toBe("en");
    expect(restored.labels.username).toBe("Username");
  });

  test("语言和主题分别保存，切换时互不影响", () => {
    storage.set("multivisor-theme", "light");
    const preferences = usePreferencesStore();

    preferences.toggleLocale();

    expect(preferences.themeName).toBe("light");
    expect(storage.get("multivisor-theme")).toBe("light");

    preferences.toggleTheme();

    expect(preferences.locale).toBe("en");
    expect(storage.get("multivisor-lang")).toBe("en");
  });
});
