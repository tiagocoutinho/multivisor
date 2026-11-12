import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import en from "./locales/en";
import zh from "./locales/zh";
import { timeAgo } from "./multivisor";

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
