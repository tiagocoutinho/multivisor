import { describe, expect, test } from "vitest";
import { computed, effectScope, nextTick, ref } from "vue";

import { useProcessView } from "./useProcessView";

const processes = [
  {
    uid: "node-a:core:alpha",
    name: "alpha",
    group: "core",
    supervisor: "node-a",
    statename: "RUNNING",
    running: true,
  },
  {
    uid: "node-a:core:beta",
    name: "beta",
    group: "core",
    supervisor: "node-a",
    statename: "FATAL",
    running: false,
  },
  {
    uid: "node-b:edge:gamma",
    name: "gamma",
    group: "edge",
    supervisor: "node-b",
    statename: "BACKOFF",
    running: true,
  },
  {
    uid: "node-b:edge:delta",
    name: "delta",
    group: "edge",
    supervisor: "node-b",
    statename: "STOPPED",
    running: false,
  },
];

const labels = {
  stateNames: {
    FATAL: "启动失败",
    RUNNING: "运行中",
  },
};

function createView(source = ref(processes), scopeKey = ref("processes")) {
  const scope = effectScope();
  const view = scope.run(() =>
    useProcessView({
      source,
      scopeKey,
      labels: ref(labels),
    }),
  );
  return { scope, view };
}

describe("共享进程视图", () => {
  test("默认显示全部，四条件交集后才返回进程", () => {
    const { scope, view } = createView();

    expect(view.search.value).toBe("");
    expect(view.quickFilter.value).toBe("all");
    expect(view.stateFilter.value).toBe("");
    expect(view.nodeFilter.value).toBe("");
    expect(view.filteredProcesses.value).toEqual(processes);
    expect(view.hasActiveFilters.value).toBe(false);

    view.quickFilter.value = "alerts";
    expect(view.filteredProcesses.value.map((item) => item.uid)).toEqual([
      "node-a:core:beta",
      "node-b:edge:gamma",
    ]);

    view.stateFilter.value = "FATAL";
    expect(view.filteredProcesses.value.map((item) => item.uid)).toEqual([
      "node-a:core:beta",
    ]);

    view.nodeFilter.value = "node-b";
    expect(view.filteredProcesses.value).toEqual([]);
    expect(view.hasActiveFilters.value).toBe(true);

    view.search.value = "gamma";
    expect(view.filteredProcesses.value).toEqual([]);
    scope.stop();
  });

  test("无匹配时返回空列表并保留原筛选条件", () => {
    const { scope, view } = createView();

    view.search.value = "does-not-exist";
    expect(view.filteredProcesses.value).toEqual([]);
    expect(view.hasActiveFilters.value).toBe(true);

    view.clearFilters();
    expect(view.search.value).toBe("");
    expect(view.quickFilter.value).toBe("all");
    expect(view.stateFilter.value).toBe("");
    expect(view.nodeFilter.value).toBe("");
    expect(view.hasActiveFilters.value).toBe(false);
    scope.stop();
  });

  test("搜索大小写不敏感并匹配原字段与本地化状态", () => {
    const { scope, view } = createView();

    const searchedNames = (query) => {
      view.search.value = query;
      return view.filteredProcesses.value.map((item) => item.name);
    };

    expect(searchedNames("ALPHA")).toEqual(["alpha"]);
    expect(searchedNames("CORE")).toEqual(["alpha", "beta"]);
    expect(searchedNames("NODE-B")).toEqual(["gamma", "delta"]);
    expect(searchedNames("BACKOFF")).toEqual(["gamma"]);
    expect(searchedNames("启动失败")).toEqual(["beta"]);
    expect(searchedNames("running")).toEqual(["alpha"]);
    expect(searchedNames("进行中")).toEqual([]);
    scope.stop();
  });

  test("节点范围变化只使用当前节点数据并清空选择", async () => {
    const scopeKey = ref("node-a");
    const { scope, view } = createView(ref(processes), scopeKey);

    view.nodeFilter.value = "node-b";
    expect(view.filteredProcesses.value).toEqual([]);
    view.clearFilters();

    view.selectedUids.value = ["node-a:core:alpha", "node-b:edge:gamma"];
    expect(view.selectedItems.value).toEqual([processes[0]]);

    scopeKey.value = "node-b";
    await nextTick();
    expect(view.selectedUids.value).toEqual([]);
    expect(view.selectedItems.value).toEqual([]);
    scope.stop();
  });

  test("筛选隐藏选择保留并计数，全选取已有 UID 与筛选结果并集", () => {
    const { scope, view } = createView(ref(processes), ref("node-a"));

    view.selectedUids.value = ["node-a:core:beta", "node-b:edge:gamma"];
    view.search.value = "beta";

    expect(view.filteredProcesses.value.map((item) => item.uid)).toEqual([
      "node-a:core:beta",
    ]);
    expect(view.selectedItems.value.map((item) => item.uid)).toEqual([
      "node-a:core:beta",
    ]);
    expect(view.selectedInViewCount.value).toBe(1);
    expect(view.selectedHiddenCount.value).toBe(1);
    expect(view.selectionGroups.value).toEqual([
      { supervisor: "node-a", processes: [processes[1]] },
    ]);

    view.selectFiltered();
    expect(view.selectedUids.value).toEqual([
      "node-a:core:beta",
      "node-b:edge:gamma",
    ]);

    view.clearFilters();
    expect(view.selectedUids.value).toEqual([
      "node-a:core:beta",
      "node-b:edge:gamma",
    ]);
    expect(view.selectedInViewCount.value).toBe(1);
    expect(view.selectedHiddenCount.value).toBe(1);
    scope.stop();
  });

  test("源更新移除失效选择，清除筛选不影响选择", async () => {
    const source = ref([...processes]);
    const { scope, view } = createView(source);

    view.selectedUids.value = ["node-a:core:beta", "node-b:edge:gamma"];
    view.search.value = "beta";
    expect(view.selectedInViewCount.value).toBe(1);
    expect(view.selectedHiddenCount.value).toBe(1);

    source.value = source.value.filter(
      (item) => item.uid !== "node-b:edge:gamma",
    );
    await nextTick();
    expect(view.selectedUids.value).toEqual(["node-a:core:beta"]);
    expect(view.selectedHiddenCount.value).toBe(0);

    view.clearFilters();
    expect(view.selectedUids.value).toEqual(["node-a:core:beta"]);
    scope.stop();
  });

  test("接受 computed 源并在源变化时清理失效选择", async () => {
    const nodeName = ref("node-a");
    const source = computed(() =>
      processes.filter((item) => item.supervisor === nodeName.value),
    );
    const { scope, view } = createView(source);

    view.selectedUids.value = ["node-a:core:alpha", "node-a:core:beta"];
    nodeName.value = "node-b";
    await nextTick();

    expect(view.filteredProcesses.value.map((item) => item.uid)).toEqual([
      "node-b:edge:gamma",
      "node-b:edge:delta",
    ]);
    expect(view.selectedUids.value).toEqual([]);
    scope.stop();
  });
});
