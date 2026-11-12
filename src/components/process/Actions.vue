<template>
  <div class="process-actions">
    <v-btn
      v-if="process.logfile || process.stderr_logfile"
      variant="text"
      size="small"
      :aria-label="`${labels.logs} ${process.name}`"
      @click="openDefaultLog"
    >
      <v-icon size="16" class="mr-1">mdi-text-box-outline</v-icon>
      {{ labels.logs }}
    </v-btn>
    <v-menu location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="small"
          :loading="pending"
          :aria-label="`${labels.moreActions} ${process.name}`"
        >
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list density="compact" min-width="180">
        <v-list-item
          prepend-icon="mdi-information-outline"
          :title="labels.info"
          @click="emit('inspect', { process, panel: 'details' })"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :prepend-icon="process.running ? 'mdi-autorenew' : 'mdi-play'"
          :title="process.running ? labels.restart : labels.start"
          :disabled="!enabled || pending"
          :aria-disabled="!enabled || pending"
          @click="emit('action', process.running ? 'restart' : 'start')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-stop"
          :title="labels.stop"
          base-color="error"
          :disabled="!enabled || !process.running || pending"
          :aria-disabled="!enabled || !process.running || pending"
          @click="emit('action', 'stop')"
        ></v-list-item>
        <v-divider v-if="process.logfile || process.stderr_logfile"></v-divider>
        <v-list-item
          v-if="process.logfile"
          prepend-icon="mdi-file-document-outline"
          :title="labels.logOut"
          @click="emit('inspect', { process, panel: 'out' })"
        ></v-list-item>
        <v-list-item
          v-if="process.stderr_logfile"
          prepend-icon="mdi-file-document-alert-outline"
          :title="labels.logErr"
          @click="emit('inspect', { process, panel: 'err' })"
        ></v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
const props = defineProps({
  process: { type: Object, required: true },
  labels: { type: Object, required: true },
  enabled: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
});

const emit = defineEmits(["inspect", "action"]);

function openDefaultLog() {
  const stream =
    props.process.statename === "FATAL" && props.process.stderr_logfile
      ? "err"
      : props.process.logfile
        ? "out"
        : "err";
  emit("inspect", { process: props.process, panel: stream });
}
</script>
