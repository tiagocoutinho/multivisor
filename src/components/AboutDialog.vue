<template>
  <v-dialog v-model="visible" max-width="960">
    <v-card>
      <v-card-item>
        <template #prepend>
          <v-avatar color="primary" size="36" rounded>
            <v-icon size="22">mdi-layers</v-icon>
          </v-avatar>
        </template>
        <v-card-title class="font-weight-medium">multivisor</v-card-title>
        <template #append>
          <v-btn
            icon
            size="small"
            variant="text"
            :aria-label="t.close"
            @click="visible = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </template>
      </v-card-item>
      <v-divider></v-divider>
      <v-card-text>
        <p class="text-body-1 mb-3">{{ t.aboutDesc }}</p>
        <dl class="about-fields">
          <dt>{{ t.aboutVersion }}</dt>
          <dd class="mono">v{{ version }}</dd>
          <dt>{{ t.aboutRepo }}</dt>
          <dd>
            <a
              class="mono c-info"
              href="https://github.com/tiagocoutinho/multivisor"
              target="_blank"
              rel="noopener noreferrer"
              >tiagocoutinho/multivisor</a
            >
          </dd>
          <dt>{{ t.aboutLicense }}</dt>
          <dd class="mono">GPL-3.0-or-later</dd>
        </dl>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { usePreferencesStore } from "@/stores/preferences";

const visible = defineModel({ type: Boolean, default: false });
const { labels: t } = storeToRefs(usePreferencesStore());
const version = __APP_VERSION__;
</script>

<style scoped>
.about-fields {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 16px;
  font-size: 14px;
}
.about-fields dt {
  color: var(--mv-c-neutral);
}
.about-fields dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.about-fields a {
  text-decoration: none;
}
</style>
