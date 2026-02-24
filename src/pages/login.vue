<template>
  <v-container fluid grid-list-md>
    <v-form v-model="valid">
      <v-layout align-center justify-center>
        <v-flex xs12 sm6 md5 lg4 xl3>
          <v-card class="elevation-12">
            <v-toolbar dark color="primary">
              <v-toolbar-title>Log in</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-form @keyup.native.enter="submit" v-model="valid" ref="form">
                <v-text-field
                  autofocus
                  prepend-icon="person"
                  name="username"
                  label="Username"
                  type="text"
                  v-model="username"
                  :rules="[rules.required]"
                  :error-messages="errorMessages['username']"
                ></v-text-field>
                <v-text-field
                  prepend-icon="lock"
                  name="password"
                  label="Password"
                  type="password"
                  v-model="password"
                  :rules="[rules.required]"
                  :error-messages="errorMessages['password']"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions align="center">
              <v-layout justify-center>
                <v-btn color="primary" location="bottom" @click="submit"
                  >Log in</v-btn
                >
              </v-layout>
            </v-card-actions>
          </v-card>
        </v-flex>
      </v-layout>
    </v-form>
  </v-container>
</template>

<script setup>
import * as api from "@/api";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const valid = false;
const username = "";
const password = "";
const rules = {
  required: (value) => !!value || "This field is required",
};
const errorMessages = {
  username: [],
  password: [],
};

const submit = () => {
  if (!this.$refs.form.validate()) {
    return;
  }
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  api.login(form).then((response) => {
    if (response.status === 200) {
      store.setIsAuthenticated(true);
      store.dispatch("init");
      this.$router.push({ name: "group" });
    } else {
      response.json().then((data) => {
        this.errorMessages = data.errors;
      });
    }
  });
};
</script>
