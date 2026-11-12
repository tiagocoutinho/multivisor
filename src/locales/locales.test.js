import { describe, expect, it } from "vitest";
import en from "./en";
import zh from "./zh";

const deletedPrototypeKeys = [
  "demoSuffix",
  "sampleLog",
  "loadFailedDemo",
  "loginDemo",
];

const prototypeKeys = [
  "nodeProcesses",
  "allNodes",
  "attentionOverview",
  "allHealthy",
  "fatalCount",
  "retryCount",
  "offlineCount",
  "alertCount",
  "noAlerts",
  "nodeUnreachable",
  "lastKnownData",
  "noAttentionNodes",
  "selectionSummary",
  "reviewSelection",
  "selectionUnavailable",
  "confirmSelectionScope",
  "selectProcess",
  "moreActions",
  "logs",
  "workspace",
  "resizeWorkspace",
  "closeWorkspace",
  "previousProcess",
  "nextProcess",
  "outsideResults",
  "searchLogs",
  "logLines",
  "copy",
  "copied",
  "copyFailed",
  "noMatchingLogs",
  "logCleared",
  "operationResults",
  "dismissResults",
  "operationPending",
  "operationFailed",
  "operationDone",
  "operationSummary",
  "confirmStartTitle",
  "confirmStartN",
  "navNodes",
  "navProcesses",
  "navAbout",
  "nodesUnit",
  "onlineUnit",
  "procsUnit",
  "procsUnit2",
  "parenL",
  "parenR",
  "runningShort",
  "online",
  "offline",
  "statAlerts",
  "enterDetail",
  "logout",
  "loggedIn",
  "loggedOut",
  "update",
  "restartNode",
  "nodeMenu",
  "restart",
  "start",
  "stop",
  "clearSelection",
  "selectFiltered",
  "selectedCount",
  "selectedHidden",
  "restartN",
  "stopN",
  "confirmScope",
  "cancel",
  "nameSep",
  "confirmRestartTitle",
  "confirmStopTitle",
  "confirmNodeRestartTitle",
  "confirmNodeRestartDesc",
  "confirmRestartN",
  "confirmStopN",
  "confirmNodeRestart",
  "nodeOfflineHint",
  "staleData",
  "info",
  "logOut",
  "logErr",
  "searchPh",
  "quickAllN",
  "quickAlertsN",
  "filterState",
  "filterNode",
  "filterAll",
  "emptyProcesses",
  "noResult",
  "clearFilters",
  "loadFailed",
  "retry",
  "colName",
  "colGroup",
  "colSupervisor",
  "colState",
  "colActions",
  "loginTitle",
  "username",
  "password",
  "loginSubmit",
  "loginEmpty",
  "about",
  "aboutDesc",
  "aboutVersion",
  "aboutRepo",
  "aboutLicense",
  "connected",
  "disconnected",
  "refresh",
  "refreshed",
  "autoScroll",
  "on",
  "off",
  "close",
  "logTypeOut",
  "logTypeErr",
  "clearDisplay",
  "expand",
  "collapse",
  "toLight",
  "toDark",
  "stateNames",
  "dStart",
  "dDescription",
  "dHost",
  "dPid",
  "dExit",
  "dOutLog",
  "dErrLog",
];

const interfaceKeys = [
  "connectionFailed",
  "navGroups",
  "openSearch",
  "toChinese",
  "toEnglish",
  "required",
  "restartSelected",
  "stopSelected",
  "selectAll",
  "remoteLogSize",
  "logSize",
  "updatedAt",
  "cardUptime",
  "cardExit",
  "operationSummaryDone",
  "reviveStream",
  "reviveStreamTitle",
  "reviveStreamText",
  "reviveConfirm",
];

const aboutContentKeys = [
  "features",
  "featureStatus",
  "featureActions",
  "featureNotifications",
  "featureMobile",
  "featureFilters",
  "featureCli",
  "featurePlatforms",
  "components",
  "componentIntro",
  "componentWeb",
  "componentRpc",
  "componentCli",
];

const timeAgoKeys = [
  "prefix",
  "suffix",
  "seconds",
  "minute",
  "minutes",
  "hour",
  "hours",
  "day",
  "days",
  "month",
  "months",
  "year",
  "years",
];

const migratedInterfaceKeys = [
  "noOfflineNodes",
  "emptyNodes",
  "nodeNotFound",
  "backToNodes",
  "user",
  "notReceivedYet",
  "processUnavailable",
  "invalidLogMessage",
  "logStreamFailed",
  "invalidCredentials",
  "loginFailedNetwork",
  "loginFailed",
  "showPassword",
  "hidePassword",
  "operationSending",
  "operationNotSubmitted",
  "confirmNodeUpdateDesc",
];
const additionalRootKeys = [
  ...interfaceKeys,
  ...migratedInterfaceKeys,
  "aboutContent",
  "timeAgo",
];

const statusCodes = [
  "STOPPED",
  "STARTING",
  "RUNNING",
  "BACKOFF",
  "STOPPING",
  "EXITED",
  "FATAL",
  "UNKNOWN",
];

const functionArities = {
  fatalCount: 1,
  retryCount: 1,
  offlineCount: 1,
  alertCount: 1,
  selectionSummary: 2,
  confirmSelectionScope: 2,
  selectProcess: 1,
  operationDone: 1,
  operationSummary: 2,
  operationSummaryDone: 1,
  confirmStartTitle: 1,
  confirmStartN: 1,
  selectedCount: 1,
  selectedHidden: 2,
  restartN: 1,
  stopN: 1,
  confirmRestartTitle: 1,
  confirmStopTitle: 1,
  confirmNodeRestartDesc: 1,
  confirmRestartN: 1,
  confirmStopN: 1,
  quickAllN: 1,
  quickAlertsN: 1,
  updatedAt: 1,
  confirmNodeUpdateDesc: 1,
};

describe("aboutContent", () => {
  it("包含现有 About 页所需的全部嵌套键", () => {
    expect(Object.keys(zh.aboutContent)).toEqual(aboutContentKeys);
    expect(Object.keys(en.aboutContent)).toEqual(aboutContentKeys);
  });
});

describe("timeAgo", () => {
  it("保留原时间模板键并使用占位符", () => {
    expect(Object.keys(zh.timeAgo)).toEqual(timeAgoKeys);
    expect(Object.keys(en.timeAgo)).toEqual(timeAgoKeys);
    expect(zh.timeAgo.minutes).toBe("%d 分钟");
    expect(zh.timeAgo.years).toBe("%d 年");
    expect(en.timeAgo.minutes).toBe("%d minutes");
    expect(en.timeAgo.years).toBe("%d years");
  });
});

function leafEntries(dictionary) {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    if (value !== null && typeof value === "object") {
      return leafEntries(value).map(([childKey, leaf]) => [
        `${key}.${childKey}`,
        leaf,
      ]);
    }
    return [[key, value]];
  });
}

describe("locales", () => {
  it("双语词典使用相同的递归键路径和叶子类型", () => {
    const zhLeaves = leafEntries(zh);
    const enLeaves = leafEntries(en);
    const zhPaths = zhLeaves.map(([path]) => path).sort();
    const enPaths = enLeaves.map(([path]) => path).sort();

    expect(zhPaths).toEqual(enPaths);
    expect(zhLeaves.map(([path, value]) => [path, typeof value])).toEqual(
      enLeaves.map(([path, value]) => [path, typeof value]),
    );
  });

  it("完整保留原型键，仅移除四个专属演示键，并包含现有界面键", () => {
    const keys = Object.keys(zh);
    expect([...keys].sort()).toEqual(
      [...prototypeKeys, ...additionalRootKeys].sort(),
    );
    expect(deletedPrototypeKeys.some((key) => keys.includes(key))).toBe(false);
    expect(keys).toEqual(expect.arrayContaining(interfaceKeys));
  });

  it("状态码键完整且不被改名", () => {
    expect(Object.keys(zh.stateNames)).toEqual(statusCodes);
    expect(Object.keys(en.stateNames)).toEqual(statusCodes);
  });

  it("普通函数保持原参数数量和顺序，并输出包含对应参数的结果", () => {
    for (const [key, arity] of Object.entries(functionArities)) {
      expect(typeof zh[key]).toBe("function");
      expect(typeof en[key]).toBe("function");
      expect(zh[key].length).toBe(arity);
      expect(en[key].length).toBe(arity);
    }

    expect(zh.selectionSummary(3, 2)).toBe("已选 3 个进程 · 来自 2 个节点");
    expect(en.selectionSummary(3, 2)).toBe("3 selected across 2 nodes");

    expect(zh.confirmSelectionScope(2, 5)).toBe(
      "本次仅影响下列 2 个节点中的 5 个进程。",
    );
    expect(en.confirmSelectionScope(2, 5)).toBe(
      "Only these 5 processes across 2 nodes will be affected.",
    );

    expect(zh.selectedHidden(8, 3)).toBe("当前结果中 8 个，筛选隐藏 3 个");
    expect(en.selectedHidden(8, 3)).toBe(
      "8 in current results, 3 hidden by filters",
    );

    expect(zh.operationSummary(4, 1)).toBe(
      "4 个请求提交成功，1 个请求提交失败",
    );
    expect(en.operationSummary(4, 1)).toBe(
      "4 request submissions succeeded, 1 request submission failed",
    );
    expect(zh.operationSummaryDone(16)).toBe("已提交 16 个请求");
    expect(en.operationSummaryDone(16)).toContain("16");

    expect(zh.updatedAt("12:00")).toBe("最近更新：12:00");
    expect(en.updatedAt("12:00")).toBe("Last updated 12:00");

    expect(zh.confirmNodeRestartDesc("node-a")).toContain("node-a");
    expect(en.confirmNodeRestartDesc("node-a")).toContain("node-a");
    expect(zh.confirmNodeUpdateDesc("node-a")).toContain("node-a");
    expect(en.confirmNodeUpdateDesc("node-a")).toContain("node-a");
    expect(zh.selectProcess("api")).toContain("api");
    expect(en.selectProcess("api")).toContain("api");
    expect(zh.quickAllN(12)).toContain("12");
    expect(en.quickAllN(12)).toContain("12");
  });

  it("操作反馈只描述请求提交，不声称执行完成", () => {
    const kinds = ["nodeRestart", "stop", "start"];

    for (const kind of kinds) {
      expect(zh.operationDone(kind)).toBe("请求已提交");
      expect(en.operationDone(kind)).toBe("Request submitted");
    }
    expect(zh.operationFailed).toBe("请求提交失败");
    expect(en.operationFailed).toBe("Failed to submit request");
  });

  it("词典不保留演示或模拟文案，刷新语义为数据已刷新", () => {
    const leaves = [...leafEntries(zh), ...leafEntries(en)];

    expect(
      leaves.filter(
        ([path]) => path === "refreshed" || path.endsWith(".refreshed"),
      ),
    ).toEqual([
      ["refreshed", "数据已刷新"],
      ["refreshed", "Data refreshed"],
    ]);
    for (const [path, value] of leaves) {
      if (typeof value !== "string") continue;
      expect(`${path}=${value}`).not.toMatch(/演示|模拟|demo|simulated/i);
    }
  });
});
