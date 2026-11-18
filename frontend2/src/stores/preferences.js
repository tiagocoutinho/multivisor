import { defineStore } from "pinia";

import zh from "@/locales/zh";
import en from "@/locales/en";

export const readThemePreference = () =>
  localStorage.getItem("multivisor-theme") === "light" ? "light" : "dark";

export const readLocalePreference = () =>
  localStorage.getItem("multivisor-lang") === "en" ? "en" : "zh";

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    themeName: readThemePreference(),
    locale: readLocalePreference(),
  }),
  getters: {
    labels: (state) => (state.locale === "en" ? en : zh),
  },
  actions: {
    toggleTheme() {
      this.themeName = this.themeName === "dark" ? "light" : "dark";
      localStorage.setItem("multivisor-theme", this.themeName);
    },
    toggleLocale() {
      this.locale = this.locale === "zh" ? "en" : "zh";
      localStorage.setItem("multivisor-lang", this.locale);
    },
  },
});
