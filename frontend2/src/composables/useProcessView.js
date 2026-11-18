import { computed, ref, toValue, watch } from "vue";

import { ALERT_STATES, groupProcessesBySupervisor } from "../multivisor";

function matchesSearch(process, query, localizedStateNames) {
  return (
    process.name.toLowerCase().includes(query) ||
    process.group.toLowerCase().includes(query) ||
    process.supervisor.toLowerCase().includes(query) ||
    process.statename.toLowerCase().includes(query) ||
    (localizedStateNames[process.statename] || "").toLowerCase().includes(query)
  );
}

export function useProcessView({ source, scopeKey, labels }) {
  const search = ref("");
  const quickFilter = ref("all");
  const stateFilter = ref("");
  const nodeFilter = ref("");
  const selectedUids = ref([]);
  const selectedUidSet = computed(() => new Set(selectedUids.value));
  const localizedStateNames = computed(() => toValue(labels)?.stateNames ?? {});

  const scopedProcesses = computed(() => {
    const processes = toValue(source);
    const scope = toValue(scopeKey);
    return scope === "processes"
      ? processes
      : processes.filter((process) => process.supervisor === scope);
  });

  const filteredProcesses = computed(() => {
    const processes = scopedProcesses.value;
    const query = search.value.trim().toLowerCase();

    return processes.filter((process) => {
      if (
        quickFilter.value === "alerts" &&
        !ALERT_STATES.has(process.statename)
      ) {
        return false;
      }
      if (stateFilter.value && process.statename !== stateFilter.value) {
        return false;
      }
      if (nodeFilter.value && process.supervisor !== nodeFilter.value) {
        return false;
      }
      return !query || matchesSearch(process, query, localizedStateNames.value);
    });
  });

  const selectedItems = computed(() =>
    scopedProcesses.value.filter((process) =>
      selectedUidSet.value.has(process.uid),
    ),
  );
  const selectionGroups = computed(() =>
    groupProcessesBySupervisor(selectedItems.value),
  );
  const selectedInViewCount = computed(() =>
    filteredProcesses.value.reduce(
      (count, process) =>
        count + (selectedUidSet.value.has(process.uid) ? 1 : 0),
      0,
    ),
  );
  const selectedHiddenCount = computed(
    () => selectedUids.value.length - selectedInViewCount.value,
  );
  const hasActiveFilters = computed(
    () =>
      !!search.value ||
      quickFilter.value === "alerts" ||
      !!stateFilter.value ||
      !!nodeFilter.value,
  );

  function selectFiltered() {
    const uidSet = new Set(selectedUids.value);
    for (const process of filteredProcesses.value) {
      uidSet.add(process.uid);
    }
    selectedUids.value = [...uidSet];
  }

  function clearSelection() {
    selectedUids.value = [];
  }

  function clearFilters() {
    search.value = "";
    quickFilter.value = "all";
    stateFilter.value = "";
    nodeFilter.value = "";
  }

  watch(scopeKey, () => clearSelection());
  watch(source, (processes) => {
    const availableUids = new Set(toValue(processes).map((item) => item.uid));
    selectedUids.value = selectedUids.value.filter((uid) =>
      availableUids.has(uid),
    );
  });

  return {
    search,
    quickFilter,
    stateFilter,
    nodeFilter,
    selectedUids,
    filteredProcesses,
    selectedItems,
    selectionGroups,
    selectedInViewCount,
    selectedHiddenCount,
    hasActiveFilters,
    selectFiltered,
    clearSelection,
    clearFilters,
  };
}
