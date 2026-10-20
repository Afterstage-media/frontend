export async function api(path, options = {}) {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    Accept: "application/json",
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const token = localStorage.getItem("afterstage-token");
  if (token) headers.Authorization = `Bearer ${token}`;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const requestPath = /^https?:\/\//i.test(path) ? path : `${apiBaseUrl}${path}`;
  const response = await fetch(requestPath, { ...options, headers, cache: options.cache ?? "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "No pudimos completar la solicitud");
    error.status = response.status;
    throw error;
  }
  return data;
}

const base64UrlToBytes = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const bytesToBase64Url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function encryptAuthSecret(secret, publicKey) {
  const key = await globalThis.crypto.subtle.importKey(
    "spki",
    base64UrlToBytes(publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(secret),
  );
  return bytesToBase64Url(new Uint8Array(ciphertext));
}
