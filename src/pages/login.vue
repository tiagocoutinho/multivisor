<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="6" md="5" lg="4" xl="3">
        <v-card class="elevation-12">
          <v-toolbar color="primary">
            <v-toolbar-title>Log in</v-toolbar-title>
          </v-toolbar>
          <v-form ref="form" v-model="valid" @submit.prevent="submit">
            <v-card-text>
              <v-text-field
                autofocus
                prepend-icon="mdi-account"
                name="username"
                label="Username"
                type="text"
                v-model="username"
                :rules="[rules.required]"
                :error-messages="errorMessages.username"
              ></v-text-field>
              <v-text-field
                prepend-icon="mdi-lock"
                name="password"
                label="Password"
                type="password"
                v-model="password"
                :rules="[rules.required]"
                :error-messages="errorMessages.password"
              ></v-text-field>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn type="submit" color="primary">Log in</v-btn>
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

const store = useAppStore();
const router = useRouter();

const form = ref(null);
const valid = ref(false);
const username = ref("");
const password = ref("");
const errorMessages = ref({ username: [], password: [] });

const rules = {
  required: (value) => !!value || "This field is required",
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
