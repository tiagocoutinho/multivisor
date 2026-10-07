// Every page except this one requires a login
export const LOGIN_PATH = "/login";

/**
 * Returns the path to redirect a navigation to, or null to allow it.
 */
export function authRedirect(path, useAuthentication, isAuthenticated) {
  if (!useAuthentication) {
    return path === LOGIN_PATH ? "/" : null;
  }
  if (!isAuthenticated && path !== LOGIN_PATH) {
    return LOGIN_PATH;
  }
  if (isAuthenticated && path === LOGIN_PATH) {
    return "/";
  }
  return null;
}
