import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { compileTemplate, parse } from "@vue/compiler-sfc";
import * as Vue from "vue";

import { describe, expect, test, vi } from "vitest";

import { ref } from "vue";

import {
  LOGIN_ERROR_KINDS,
  createLoginSubmitter,
  parseLoginFailure,
} from "./login.logic";

describe("登录失败解析", () => {
  test("401 归类为认证错误并保留后端字段错误", () => {
    const failure = parseLoginFailure(401, {
      errors: { username: ["unknown user"] },
    });

    expect(failure).toEqual({
      kind: LOGIN_ERROR_KINDS.auth,
      fieldErrors: { username: ["unknown user"] },
    });
  });

  test("非 401 HTTP 归类为请求错误并保留后端字段错误", () => {
    const failure = parseLoginFailure(500, {
      errors: { password: ["expired password"] },
    });

    expect(failure).toEqual({
      kind: LOGIN_ERROR_KINDS.http,
      fieldErrors: { password: ["expired password"] },
    });
  });

  test("缺少 errors 结构时不伪装字段错误", () => {
    expect(parseLoginFailure(401, {})).toEqual({
      kind: LOGIN_ERROR_KINDS.auth,
      fieldErrors: undefined,
    });
  });
});

describe("登录提交状态机", () => {
  function createDependencies({ validateResult, loginResponse } = {}) {
    const validating = ref(false);
    const submitting = ref(false);
    let apiCalls = 0;
    let successCalls = 0;
    let fieldErrors;
    let errorKind = "";

    return {
      validating,
      submitting,
      getApiCalls: () => apiCalls,
      getSuccessCalls: () => successCalls,
      getFieldErrors: () => fieldErrors,
      getErrorKind: () => errorKind,
      dependencies: {
        validate: vi.fn(async () => validateResult),
        createFormData: () => new FormData(),
        login: vi.fn(async () => {
          apiCalls += 1;
          return loginResponse;
        }),
        clearSubmissionErrors: () => {
          fieldErrors = undefined;
          errorKind = "";
        },
        setLoginErrorKind: (kind) => {
          errorKind = kind;
        },
        setFieldErrors: (errors) => {
          fieldErrors = errors;
        },
        onSuccess: () => {
          successCalls += 1;
        },
        validating,
        submitting,
      },
    };
  }

  test("校验等待期重复进入不触发登录，成功后释放 loading", async () => {
    const { dependencies, getApiCalls, getSuccessCalls, submitting } =
      createDependencies({
        validateResult: { valid: true },
        loginResponse: { ok: true },
      });
    const submit = createLoginSubmitter(dependencies);

    const first = submit();
    await Promise.resolve();
    await submit();
    await first;

    expect(dependencies.validate).toHaveBeenCalledTimes(1);
    expect(getApiCalls()).toBe(1);
    expect(getSuccessCalls()).toBe(1);
    expect(submitting.value).toBe(false);
  });

  test("校验失败不提交登录，且 loading 完整释放", async () => {
    const {
      dependencies,
      getApiCalls,
      getSuccessCalls,
      submitting,
      validating,
    } = createDependencies({
      validateResult: { valid: false },
      loginResponse: { ok: false, status: 400 },
    });
    const submit = createLoginSubmitter(dependencies);

    await submit();

    expect(getApiCalls()).toBe(0);
    expect(getSuccessCalls()).toBe(0);
    expect(validating.value).toBe(false);
    expect(submitting.value).toBe(false);
  });

  test("401 显示认证错误并合并后端字段错误", async () => {
    const { dependencies, getErrorKind, getFieldErrors, submitting } =
      createDependencies({
        validateResult: { valid: true },
        loginResponse: {
          ok: false,
          status: 401,
          json: async () => ({ errors: { password: ["invalid"] } }),
        },
      });
    const submit = createLoginSubmitter(dependencies);

    await submit();

    expect(getErrorKind()).toBe(LOGIN_ERROR_KINDS.auth);
    expect(getFieldErrors()).toEqual({ password: ["invalid"] });
    expect(submitting.value).toBe(false);
  });

  test("网络异常与登录响应异常都释放 loading", async () => {
    const { dependencies, getErrorKind, submitting } = createDependencies({
      validateResult: { valid: true },
    });
    dependencies.login.mockRejectedValueOnce(new Error("network down"));
    const submit = createLoginSubmitter(dependencies);

    await submit();

    expect(getErrorKind()).toBe(LOGIN_ERROR_KINDS.network);
    expect(submitting.value).toBe(false);
  });
});

describe("登录页结构", () => {
  function renderTemplate() {
    const filename = fileURLToPath(new URL("./login.vue", import.meta.url));
    const source = fs.readFileSync(filename, "utf8");
    const { descriptor, errors } = parse(source, { filename });
    expect(errors).toEqual([]);

    const compiled = compileTemplate({
      id: "login-structure-test",
      filename,
      source: descriptor.template.content,
      compilerOptions: {
        mode: "function",
      },
    });
    expect(compiled.errors).toEqual([]);

    const cache = new Array(
      compiled.code.match(/\$cache\[(\d+)\]/g)?.length ?? 0,
    ).fill(undefined);
    const render = new Function("Vue", `${compiled.code}; return render;`)(Vue);
    return render(
      {
        busy: false,
        errorMessages: { username: [], password: [] },
        form: null,
        loginError: "",
        password: "password-value",
        requiredMessage: "validation.required",
        rules: { required: () => true },
        showPassword: false,
        store: { name: "multivisor-cluster" },
        submit: () => {},
        t: {
          aboutDesc: "test description",
          hidePassword: "hide password",
          loginSubmit: "log in",
          password: "password",
          required: "required",
          showPassword: "show password",
          username: "username",
        },
        username: "username-value",
        version: "test-version",
      },
      cache,
    );
  }

  function collectVNodes(vnode, result = []) {
    if (!vnode) {
      return result;
    }
    result.push(vnode);
    let children = vnode.children;
    if (typeof children === "function") {
      children = children();
    }
    if (Array.isArray(children)) {
      children.forEach((child) => collectVNodes(child, result));
    } else if (children && typeof children === "object") {
      Object.values(children).forEach((slot) => {
        if (typeof slot === "function") {
          collectVNodes(slot({ message: "validation.required" }), result);
        }
      });
    }
    return result;
  }

  test("提交校验入口挂载在 v-form，而不是用户名输入框", () => {
    const vNodes = collectVNodes(renderTemplate());
    const form = vNodes.find((vnode) => vnode.type === "v-form");
    const textFields = vNodes.filter((vnode) => vnode.type === "v-text-field");

    expect(form).toBeDefined();
    expect(form.props.ref).toBe("form");
    expect(textFields).toHaveLength(2);
    textFields.forEach((field) => {
      expect(field.props.ref).toBeUndefined();
    });
  });

  test("密码输入保留标签，显隐按钮单独携带可访问名", () => {
    const vNodes = collectVNodes(renderTemplate());
    const passwordField = vNodes.find(
      (vnode) =>
        vnode.type === "v-text-field" &&
        vnode.props.autocomplete === "current-password",
    );

    expect(passwordField).toBeDefined();
    expect(passwordField.props.label).toBe("password");
    expect(passwordField.props["aria-label"]).toBeUndefined();

    const appendNodes = passwordField.children["append-inner"]();
    const visibilityButton = appendNodes.find(
      (vnode) => vnode.type === "v-btn" && vnode.props.type === "button",
    );

    expect(visibilityButton).toBeDefined();
    expect(visibilityButton.props["aria-label"]).toBe("show password");
  });
});
