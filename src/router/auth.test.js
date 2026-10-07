import { describe, expect, test } from "vitest";

import { authRedirect, LOGIN_PATH } from "./auth";

describe("authRedirect", () => {
  describe("without authentication", () => {
    test("allows every page", () => {
      expect(authRedirect("/", false, false)).toBeNull();
      expect(authRedirect("/group", false, false)).toBeNull();
    });

    test("redirects the login page to home", () => {
      expect(authRedirect(LOGIN_PATH, false, false)).toBe("/");
    });
  });

  describe("with authentication, not logged in", () => {
    test.each(["/", "/group", "/process", "/supervisor", "/about"])(
      "redirects %s to the login page",
      (path) => {
        expect(authRedirect(path, true, false)).toBe(LOGIN_PATH);
      },
    );

    test("allows the login page", () => {
      expect(authRedirect(LOGIN_PATH, true, false)).toBeNull();
    });
  });

  describe("with authentication, logged in", () => {
    test("allows every page", () => {
      expect(authRedirect("/", true, true)).toBeNull();
      expect(authRedirect("/group", true, true)).toBeNull();
    });

    test("redirects the login page to home", () => {
      expect(authRedirect(LOGIN_PATH, true, true)).toBe("/");
    });
  });
});
