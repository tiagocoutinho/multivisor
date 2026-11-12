<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="6" md="5" lg="4" xl="3">
        <v-card class="elevation-12">
          <v-toolbar color="primary">
            <v-toolbar-title>{{ t.loginTitle }}</v-toolbar-title>
          </v-toolbar>
          <v-form ref="form" v-model="valid" @submit.prevent="submit">
            <v-card-text>
              <v-text-field
                autofocus
                prepend-icon="mdi-account"
                name="username"
                :label="t.username"
                type="text"
                v-model="username"
                :rules="[rules.required]"
                :error-messages="errorMessages.username"
              >
                <template #message="{ message }">
                  {{ message === REQUIRED_MESSAGE ? t.required : message }}
                </template>
              </v-text-field>
              <v-text-field
                prepend-icon="mdi-lock"
                name="password"
                :label="t.password"
                type="password"
                v-model="password"
                :rules="[rules.required]"
                :error-messages="errorMessages.password"
              >
                <template #message="{ message }">
                  {{ message === REQUIRED_MESSAGE ? t.required : message }}
                </template>
              </v-text-field>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn type="submit" color="primary">{{ t.loginSubmit }}</v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from "vue-router";

import * as api from "@/api";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());
const router = useRouter();

const form = ref(null);
const valid = ref(false);
const username = ref("");
const password = ref("");
const errorMessages = ref({ username: [], password: [] });

// 校验保存稳定标识，显示时取当前词典，避免切换语言时重新校验表单。
const REQUIRED_MESSAGE = "validation.required";
const rules = {
  required: (value) => !!value || REQUIRED_MESSAGE,
};

async function submit() {
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }
  const data = new FormData();
  data.append("username", username.value);
  data.append("password", password.value);
  const response = await api.login(data);
  if (response.ok) {
    store.setIsAuthenticated(true);
    store.init();
    router.push("/");
  } else {
    const result = await response.json();
    errorMessages.value = { username: [], password: [], ...result.errors };
  }
}
</script>
