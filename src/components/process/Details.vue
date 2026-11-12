<template>
  <div v-if="!process" class="inspector-unavailable c-attention" role="status">
    {{ labels.processUnavailable }}
  </div>
  <dl v-else class="inspector-details">
    <div
      v-for="field in detailFields"
      :key="field.id"
      :class="{ 'inspector-detail--wide': field.wide }"
    >
      <dt>{{ labels[field.labelKey] }}</dt>
      <dd class="mono">
        {{ detailValues[field.id] === "" ? "—" : detailValues[field.id] }}
      </dd>
    </div>
  </dl>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  labels: { type: Object, required: true },
  locale: { type: String, default: "zh" },
  process: { type: Object, default: null },
});

const detailFields = [
  { id: "pid", labelKey: "dPid" },
  { id: "exitstatus", labelKey: "dExit" },
  { id: "host", labelKey: "dHost" },
  { id: "start", labelKey: "dStart", isTime: true },
  { id: "supervisor", labelKey: "colSupervisor" },
  { id: "description", labelKey: "dDescription" },
  { id: "logfile", labelKey: "dOutLog", wide: true },
  { id: "stderr_logfile", labelKey: "dErrLog", wide: true },
];

function formatDetailValue(field) {
  const value = props.process?.[field.id];
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (field.isTime && value) {
    return new Date(value * 1000).toLocaleString(
      props.locale === "zh" ? "zh-CN" : "en-US",
    );
  }
  return String(value);
}

const detailValues = computed(() =>
  Object.fromEntries(
    detailFields.map((field) => [field.id, formatDetailValue(field)]),
  ),
);
</script>

<style scoped>
.inspector-unavailable {
  align-items: center;
  display: flex;
  font-size: 13px;
  min-height: 42px;
}
</style>
