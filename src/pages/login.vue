<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <div class="text-center mb-6">
          <v-avatar size="64" rounded="xl" class="login-logo mb-4">
            <v-icon size="36" icon="mdi-layers"></v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-medium mb-1">multivisor</div>
          <div class="text-body-2 opacity-60">
            {{ store.name }} · {{ t.aboutDesc }}
          </div>
        </div>

        <v-card class="login-card pa-6" elevation="0">
          <v-form ref="form" @submit.prevent="submit">
            <v-text-field
              v-model="username"
              name="username"
              prepend-inner-icon="mdi-account-outline"
              :label="t.username"
              type="text"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              color="primary"
              class="mb-3"
              autocomplete="username"
              :rules="[rules.required]"
              :error-messages="errorMessages.username"
            >
              <template #message="{ message }">
                {{ message === REQUIRED_MESSAGE ? t.required : message }}
              </template>
            </v-text-field>
            <v-text-field
              v-model="password"
              name="password"
              prepend-inner-icon="mdi-lock-outline"
              :type="showPassword ? 'text' : 'password'"
              :label="t.password"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              color="primary"
              class="mb-1"
              autocomplete="current-password"
              :rules="[rules.required]"
              :error-messages="errorMessages.password"
            >
              <template #append-inner>
                <v-btn
                  type="button"
                  variant="text"
                  density="compact"
                  :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :aria-label="showPassword ? t.hidePassword : t.showPassword"
                  @click="showPassword = !showPassword"
                ></v-btn>
              </template>
              <template #message="{ message }">
                {{ message === REQUIRED_MESSAGE ? t.required : message }}
              </template>
            </v-text-field>

            <v-alert
              v-if="loginError"
              variant="tonal"
              type="error"
              density="compact"
              rounded="lg"
              class="mb-3"
            >
              {{ loginError }}
            </v-alert>

            <v-btn
              type="submit"
              block
              size="large"
              rounded="lg"
              color="primary"
              class="mt-2 login-btn"
              :loading="busy"
              :disabled="busy"
            >
              {{ t.loginSubmit }}
            </v-btn>
          </v-form>
        </v-card>

        <div class="text-center text-caption opacity-40 mt-5 mono">
          multivisor v{{ version }} · GPL-3.0-or-later
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import * as api from "@/api";
import { LOGIN_ERROR_KINDS, createLoginSubmitter } from "@/pages/login.logic";
import { useAppStore } from "@/stores/app";
import { usePreferencesStore } from "@/stores/preferences";

const store = useAppStore();
const { labels: t } = storeToRefs(usePreferencesStore());
const router = useRouter();

const form = ref(null);
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const validating = ref(false);
const busy = computed(() => validating.value || submitting.value);
const errorMessages = ref({ username: [], password: [] });
const loginErrorKind = ref("");
const version = __APP_VERSION__;

// 校验保存稳定标识，显示时取当前词典，避免切换语言时重新校验表单。
const REQUIRED_MESSAGE = "validation.required";
const rules = {
  required: (value) => !!value || REQUIRED_MESSAGE,
};

const loginErrorMessageKeys = {
  [LOGIN_ERROR_KINDS.auth]: "invalidCredentials",
  [LOGIN_ERROR_KINDS.network]: "loginFailedNetwork",
  [LOGIN_ERROR_KINDS.http]: "loginFailed",
};

const loginError = computed(() => {
  const key = loginErrorMessageKeys[loginErrorKind.value];
  return key ? t.value[key] : "";
});

const submit = createLoginSubmitter({
  validate: () => form.value.validate(),
  createFormData: () => {
    const data = new FormData();
    data.append("username", username.value);
    data.append("password", password.value);
    return data;
  },
  login: (data) => api.login(data),
  clearSubmissionErrors: () => {
    errorMessages.value = { username: [], password: [] };
    loginErrorKind.value = "";
  },
  setLoginErrorKind: (kind) => {
    loginErrorKind.value = kind;
  },
  setFieldErrors: (fieldErrors) => {
    errorMessages.value = {
      username: [],
      password: [],
      ...fieldErrors,
    };
  },
  onSuccess: () => {
    store.setIsAuthenticated(true);
    store.init();
    router.push("/");
  },
  validating,
  submitting,
});
</script>
