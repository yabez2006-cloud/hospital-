const AUTH_STORAGE_KEY = "hms-auth-session";

export function getAuthSession() {
  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

export function setAuthSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthUser() {
  return getAuthSession()?.user || null;
}

export function getAuthToken() {
  return getAuthSession()?.token || "";
}