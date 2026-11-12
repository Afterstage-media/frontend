const sessionHintKey = "afterstage-session-present";
const legacyTokenKey = "afterstage-token";

export function hasSessionHint() {
  try {
    const legacyToken = window.localStorage.getItem(legacyTokenKey);
    if (legacyToken) {
      window.localStorage.removeItem(legacyTokenKey);
      window.localStorage.setItem(sessionHintKey, "1");
      return true;
    }
    return window.localStorage.getItem(sessionHintKey) === "1";
  } catch {
    return false;
  }
}

export function setSessionHint(active) {
  try {
    window.localStorage.removeItem(legacyTokenKey);
    if (active) window.localStorage.setItem(sessionHintKey, "1");
    else window.localStorage.removeItem(sessionHintKey);
  } catch {
    // The server-side HttpOnly cookie remains the authentication source.
  }
}
