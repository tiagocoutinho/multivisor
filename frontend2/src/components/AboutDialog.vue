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
      <!-- 双页签（2026-11-13）：关于（基本信息+特性+组件） / 功能说明（操作指南） -->
      <v-tabs v-model="tab" density="compact" color="primary">
        <v-tab value="about">{{ t.about }}</v-tab>
        <v-tab value="guide">{{ t.aboutContent.guideTab }}</v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-card-text>
        <!-- ========== 页签 1：关于 ========== -->
        <div v-show="tab === 'about'">
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

          <!-- 官方 About 页遗留内容补全（2026-11-13）：特性 + 组件构成 -->
          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 mb-2">{{ t.aboutContent.features }}</div>
          <ul class="about-features">
            <li v-for="item in featureItems" :key="item">{{ item }}</li>
          </ul>

          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 mb-1">
            {{ t.aboutContent.components }}
          </div>
          <p class="text-body-2 c-neutral mb-2">
            {{ t.aboutContent.componentIntro }}
          </p>
          <ul class="about-components">
            <li v-for="comp in componentItems" :key="comp.name">
              <span class="mono about-comp-name">{{ comp.name }}</span>
              <span class="about-comp-desc">{{ comp.desc }}</span>
            </li>
          </ul>
        </div>

        <!-- ========== 页签 2：功能说明（2026-11-13 新增，分组可扩展） ========== -->
        <div v-show="tab === 'guide'">
          <div class="text-subtitle-2 mb-3">
            {{ t.aboutContent.guideNodeOps }}
          </div>
          <div class="about-guide">
            <div
              v-for="item in t.aboutContent.guideNodeItems"
              :key="item.name"
              class="about-guide-item"
            >
              <div class="about-guide-head">
                <v-icon size="17">{{ item.icon }}</v-icon>
                <span class="about-guide-name">{{ item.name }}</span>
              </div>
              <div class="about-guide-desc">{{ item.desc }}</div>
              <ul class="about-guide-notes">
                <li v-for="note in item.notes" :key="note">{{ note }}</li>
              </ul>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { usePreferencesStore } from "@/stores/preferences";

const visible = defineModel({ type: Boolean, default: false });
const { labels: t } = storeToRefs(usePreferencesStore());
const version = __APP_VERSION__;
// 关于弹窗页签：about = 关于 / guide = 功能说明；默认落在"关于"
const tab = ref("about");
const featureItems = computed(() => {
  const content = t.value.aboutContent;
  return [
    content.featureStatus,
    content.featureActions,
    content.featureNotifications,
    content.featureMobile,
    content.featureFilters,
    content.featureCli,
    content.featurePlatforms,
  ];
});
const componentItems = computed(() => {
  const content = t.value.aboutContent;
  return [content.componentWeb, content.componentRpc, content.componentCli];
});
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
/* 官方内容补全区：特性双列网格 + 组件名称/描述分行 */
.about-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 6px 24px;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13.5px;
}
.about-features li {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.about-features li::before {
  content: "";
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--mv-c-info);
  align-self: center;
}
.about-components {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.about-components li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.about-comp-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--mv-c-info);
}
.about-comp-desc {
  font-size: 13px;
  color: var(--mv-c-neutral);
}
/* 功能说明页签：功能项卡片（分组可扩展，双列自适应） */
.about-guide {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
.about-guide-item {
  padding: 12px 14px;
  border: 1px solid var(--mv-table-border);
  border-radius: 8px;
  background: var(--mv-table-bg);
}
.about-guide-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  color: var(--mv-c-info);
}
.about-guide-name {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
}
.about-guide-desc {
  font-size: 13px;
  margin-bottom: 7px;
}
.about-guide-notes {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.about-guide-notes li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  color: var(--mv-c-neutral);
}
.about-guide-notes li::before {
  content: "";
  flex: none;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--mv-c-neutral);
  align-self: center;
}
</style>
