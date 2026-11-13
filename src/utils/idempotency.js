const fingerprint = async (value) => {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export async function getStableIdempotencyKey(scope, payload) {
  const hash = await fingerprint(payload);
  const fingerprintKey = `afterstage:${scope}:fingerprint`;
  const requestKey = `afterstage:${scope}:key`;
  try {
    const existingHash = window.sessionStorage.getItem(fingerprintKey);
    let idempotencyKey = window.sessionStorage.getItem(requestKey);
    if (!idempotencyKey || existingHash !== hash) {
      idempotencyKey = globalThis.crypto.randomUUID();
      window.sessionStorage.setItem(fingerprintKey, hash);
      window.sessionStorage.setItem(requestKey, idempotencyKey);
    }
    return idempotencyKey;
  } catch {
    return globalThis.crypto.randomUUID();
  }
}

export function clearStableIdempotencyKey(scope) {
  try {
    window.sessionStorage.removeItem(`afterstage:${scope}:fingerprint`);
    window.sessionStorage.removeItem(`afterstage:${scope}:key`);
  } catch {
    // Storage may be unavailable; the next submission will generate a fresh in-memory key.
  }
}
