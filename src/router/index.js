/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from "vue-router";
import { setupLayouts } from "virtual:generated-layouts";
import { routes } from "vue-router/auto-routes";

import { useAppStore } from "@/stores/app";
import * as api from "@/api";

const loginRequired = { meta: { requiresAuth: true } };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (!localStorage.getItem("vuetify:dynamic-reload")) {
      console.log("Reloading page to fix dynamic import error");
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    } else {
      console.error("Dynamic import error, reloading page did not fix it", err);
    }
  } else {
    console.error(err, to);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

// Authentication
router.beforeEach(async function (to, from, next) {
  const store = useAppStore();

  if (
    store.useAuthentication === undefined ||
    store.isAuthenticated === undefined
  ) {
    const response = await api.auth();
    if (response.status === 504) {
      return next();
    }
    const data = await response.json();
    store.setUseAuthentication(data.use_authentication);
    store.setIsAuthenticated(data.is_authenticated);
  }
  if (!store.useAuthentication) {
    if (to.name === "Login") {
      return next({ name: "Group" });
    }
    return next();
  }
  const loginRequiredRoute = to.matched.some(
    (route) => route.meta.requiresAuth,
  );
  // if user is not authenticated and route requires login -> redirect to login page
  if (!store.isAuthenticated && loginRequiredRoute) {
    return next({ name: "Login" });
  }
  // if user is authenticated and navigates to login page -> redirect to home page
  if (to.name === "Login" && store.isAuthenticated) {
    return next({ name: "Group" });
  }
  return next();
});

export default router;
