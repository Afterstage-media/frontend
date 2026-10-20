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
