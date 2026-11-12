export const LOGIN_ERROR_KINDS = {
  auth: "auth",
  network: "network",
  http: "http",
};

export function parseLoginFailure(status, body) {
  const fieldErrors = body?.errors;
  return {
    kind: status === 401 ? LOGIN_ERROR_KINDS.auth : LOGIN_ERROR_KINDS.http,
    fieldErrors,
  };
}

async function responseToBody(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export function createLoginSubmitter({
  validate,
  createFormData,
  login,
  clearSubmissionErrors,
  setLoginErrorKind,
  setFieldErrors,
  onSuccess,
  validating,
  submitting,
}) {
  return async function submitLogin() {
    // 校验是异步的；这里先同步占用入口，避免校验等待期间再次进入提交。
    if (validating.value || submitting.value) {
      return;
    }

    validating.value = true;
    clearSubmissionErrors();

    let valid = false;
    try {
      ({ valid } = await validate());
    } finally {
      validating.value = false;
    }

    if (!valid) {
      return;
    }

    // validate 恢复执行后，这里到置位 submitting 之间没有事件循环切换；
    // 并发提交不能插入到检查与置位之间。
    submitting.value = true;

    try {
      const response = await login(createFormData());
      if (!response.ok) {
        const failure = parseLoginFailure(
          response.status,
          await responseToBody(response),
        );
        setLoginErrorKind(failure.kind);
        setFieldErrors(failure.fieldErrors);
        return;
      }

      onSuccess();
    } catch {
      setLoginErrorKind(LOGIN_ERROR_KINDS.network);
    } finally {
      submitting.value = false;
    }
  };
}
