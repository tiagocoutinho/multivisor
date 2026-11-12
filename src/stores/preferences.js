import { defineStore } from "pinia";

export const readThemePreference = () =>
  localStorage.getItem("multivisor-theme") === "light" ? "light" : "dark";

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    themeName: readThemePreference(),
  }),
  actions: {
    toggleTheme() {
      this.themeName = this.themeName === "dark" ? "light" : "dark";
      localStorage.setItem("multivisor-theme", this.themeName);
    },
  },
});
