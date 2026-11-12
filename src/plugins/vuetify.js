/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

import { readThemePreference } from "@/stores/preferences";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: readThemePreference(),
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: "#58a6ff",
          success: "#3fb981",
          warning: "#d9aa52",
          error: "#e58a7c",
          info: "#58a6ff",
        },
      },
      light: {
        dark: false,
        colors: {
          primary: "#0969da",
          success: "#1a7f37",
          warning: "#9a6700",
          error: "#cf222e",
          info: "#0969da",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});
