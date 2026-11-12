import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import en from "./locales/en";
import zh from "./locales/zh";
import {
  ALERT_STATES,
  countAlertProcesses,
  countRunningProcesses,
  groupProcessesBySupervisor,
  stateClassMap,
  timeAgo,
} from "./multivisor";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T04:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("相对时间本地化", () => {
  test.each([
    [30, "不到一分钟前", "less than a minute ago"],
    [60, "约一分钟前", "about a minute ago"],
    [300, "5 分钟前", "5 minutes ago"],
    [3600, "约一小时前", "about an hour ago"],
    [7200, "约 2 小时前", "about 2 hours ago"],
    [86400, "一天前", "a day ago"],
    [259200, "3 天前", "3 days ago"],
    [3456000, "约一个月前", "about a month ago"],
    [10368000, "4 个月前", "4 months ago"],
    [31536000, "约一年前", "about a year ago"],
    [63072000, "2 年前", "2 years ago"],
  ])("经过 %d 秒时使用对应语言且保留时间口径", (seconds, chinese, english) => {
    const timestamp = Date.now() / 1000 - seconds;

    expect(timeAgo(timestamp, zh.timeAgo)).toBe(chinese);
    expect(timeAgo(timestamp, en.timeAgo)).toBe(english);
  });

  test("不传词典时保持既有英文行为", () => {
    const timestamp = Date.now() / 1000 - 300;

    expect(timeAgo(timestamp)).toBe("5 minutes ago");
  });
});

describe("进程纯计算", () => {
  const processes = [
    {
      uid: "a:r",
      name: "alpha",
      group: "core",
      supervisor: "node-a",
      statename: "RUNNING",
      running: true,
    },
    {
      uid: "a:f",
      name: "beta",
      group: "core",
      supervisor: "node-a",
      statename: "FATAL",
      running: false,
    },
    {
      uid: "b:b",
      name: "gamma",
      group: "edge",
      supervisor: "node-b",
      statename: "BACKOFF",
      running: true,
    },
    {
      uid: "b:s",
      name: "delta",
      group: "edge",
      supervisor: "node-b",
      statename: "STOPPED",
      running: false,
    },
  ];

  test("导出状态集合与状态样式映射", () => {
    expect(ALERT_STATES).toEqual(new Set(["FATAL", "BACKOFF", "UNKNOWN"]));
    expect(stateClassMap).toEqual({
      RUNNING: "c-running",
      FATAL: "c-danger",
      BACKOFF: "c-attention",
      UNKNOWN: "c-attention",
      STARTING: "c-info",
      STOPPING: "c-info",
      STOPPED: "c-neutral",
      EXITED: "c-neutral",
    });
  });

  test("严格统计运行和需关注进程", () => {
    expect(countRunningProcesses(processes)).toBe(1);
    expect(countAlertProcesses(processes)).toBe(2);
    expect(countRunningProcesses([])).toBe(0);
    expect(countAlertProcesses([])).toBe(0);
  });

  test("按节点保持首次出现顺序分组", () => {
    expect(groupProcessesBySupervisor(processes)).toEqual([
      { supervisor: "node-a", processes: [processes[0], processes[1]] },
      { supervisor: "node-b", processes: [processes[2], processes[3]] },
    ]);
    expect(groupProcessesBySupervisor([])).toEqual([]);
  });
});
