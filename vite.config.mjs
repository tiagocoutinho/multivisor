// Plugins
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Layouts from "vite-plugin-vue-layouts-next";
import webfontDownload from "vite-plugin-webfont-dl";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";

// Version from the latest git tag (same source as setuptools_scm for the
// Python package). MULTIVISOR_VERSION overrides it, e.g. for builds without
// git history.
function appVersion() {
  if (process.env.MULTIVISOR_VERSION) {
    return process.env.MULTIVISOR_VERSION;
  }
  try {
    return execSync("git describe --tags --dirty", { stdio: "pipe" })
      .toString()
      .trim()
      .replace(/^v/, "");
  } catch {
    return "unknown";
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Layouts(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
      },
    }),
    Components({ directoryAsNamespace: true }),
    AutoImport({
      imports: [
        "vue",
        VueRouterAutoImports,
        {
          pinia: ["defineStore", "storeToRefs"],
        },
      ],
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    webfontDownload(),
  ],
  optimizeDeps: {
    exclude: [
      "vuetify",
      "vue-router",
      "unplugin-vue-router/runtime",
      "unplugin-vue-router/data-loaders",
      "unplugin-vue-router/data-loaders/basic",
    ],
  },
  define: {
    "process.env": {},
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:22000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
      scss: {
        api: "modern-compiler",
      },
    },
  },
  build: {
    outDir: "multivisor/server/dist",
    emptyOutDir: true,
  },
  test: {
    // e2e/ holds Playwright tests
    include: ["src/**/*.test.js"],
  },
});
