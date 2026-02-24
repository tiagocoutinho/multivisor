<template>
  <v-bottom-sheet v-model="visible">
    <v-toolbar
      density="compact"
      :color="log.stream === 'err' ? 'orange' : 'blue'"
    >
      <v-toolbar-title
        :text="title"
        class="log-toolbar-title"
      ></v-toolbar-title>
      <template v-slot:append>
        <div>
          <v-switch
            :label="`Auto scroll ${autoScroll ? 'On' : 'Off'}`"
            color="indigo"
            v-model="autoScroll"
          >
            <v-tooltip activator="parent" location="bottom">on / off</v-tooltip>
          </v-switch>
        </div>
        <!-- <span>auto-scroll ({{ autoScroll ? "On" : "Off" }})</span>
      </v-tooltip> -->
        <!-- <v-tooltip location="bottom"> -->
        <v-chip-group>
          <v-chip color="indigo white--text" @click="text = ''">
            {{ formatBytes(localSize) }}
            <v-icon icon="mdi-delete"></v-icon>
          </v-chip>
          <!-- <span>Web console log size</span>
      </v-tooltip> -->
          <!-- <v-tooltip location="bottom"> -->
          <v-chip class="bg-indigo text-white">
            {{ formatBytes(remoteSize) }}
          </v-chip>
        </v-chip-group>
        <!-- <span>Remote log size</span>
      </v-tooltip> -->
        <v-btn
          icon
          remoteSize="small"
          @click="maximize = !maximize"
          class="mr-2"
        >
          <v-icon v-if="maximize">mdi-chevron-down</v-icon>
          <v-icon v-else>mdi-chevron-up</v-icon>
        </v-btn>
      </template>
    </v-toolbar>
    <v-progress-linear
      :indeterminate="active"
      height="1"
      class="my-0"
      bg-color="white"
      color="deep-purple"
    >
    </v-progress-linear>
    <v-card>
      <v-card-text
        :style="windowSize"
        ref="log-content"
        class="overflow-y-auto bg-black text-white px-2 py-0"
      >
        <pre class="log-console">
          {{ text }}
        </pre>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup>
import { computed, useTemplateRef, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { formatBytes } from "@/multivisor";

import { useAppStore } from "@/stores/app";

const store = useAppStore();

const text = ref("");
const remoteSize = ref(0);
const maximize = ref(false);
const autoScroll = ref(true);
const eventSource = ref(null);

const { log } = storeToRefs(store);
const logContent = useTemplateRef("log-content");

const visible = computed({
  get() {
    return log.value.visible;
  },
  set(newValue) {
    store.setLogVisible(newValue);
  },
});

const title = computed(() => {
  if (!visible.value) {
    return "";
  }
  return `${log.value.stream === "out" ? "O-log of " : "E-log of "}
  ${log.value.process.name} on ${log.value.process.supervisor}`;
});

const windowSize = computed(() => {
  let h = window.innerHeight;
  return `height: ${maximize.value ? h - 80 : Math.min(h / 3, 300)}px;`;
});

const localSize = computed(() => {
  return text.value.length;
});

const active = computed(() => {
  return eventSource && eventSource.readyState < 2;
});

const appendLogMessage = (data) => {
  remoteSize.value = data.size;
  if (data.message) {
    text.value += data.message;
    /* At 10Mb, cut log to 9Mb */
    if (text.length > 1e7) {
      text.value = text.value.substr(-9000000);
    }
  } 
};

const scrollToBottom = () => {
  if (logContent.value) {    
    nextTick(() => {
      logContent.value.$el.scrollTop = logContent.value.$el.scrollHeight;
    })
  } else {
    // not mounted yet, or the element was unmounted (e.g. by v-if)
  }
}

const viewLog = () => {
  if (eventSource.value !== null) {
    text.value = "";
    remoteSize.value = 0;
    eventSource.value.close();
  }
  if (!visible.value) {
    return;
  }

  let newEventSource = new EventSource(
    `/api/process/log/${log.value.stream}/tail/${log.value.process.uid}`,
  );
  newEventSource.onmessage = (event) => {
    let data = JSON.parse(event.data);
    appendLogMessage(data);
    if (autoScroll.value) {
      scrollToBottom()
    }
  };
  newEventSource.onopen = (event) => {
    console.debug(
      log.value.stream + " stream opened for " + log.value.process.uid,
    );
  };
  newEventSource.onclose = (event) => {
    eventSource.value = null;
  };
  newEventSource.onerror = (event) => {
    eventSource.value.close();
    eventSource.value = null;
  };
  eventSource.value = newEventSource;
};

onMounted(() => {
  watch(visible, () => {
    viewLog();
  });
});
</script>

<style scoped>
.log-console {
  font-size: small;
}
.log-toolbar-title {
  font-size: medium;
}
</style>
