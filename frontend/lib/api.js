const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "";

function isPlaceholderUrl(value) {
  return !value || value.includes("your-domain.com") || value.includes("yourdomain.com");
}

export const API_URL = isPlaceholderUrl(configuredApiUrl) ? "" : configuredApiUrl.replace(/\/$/, "");

export function serverApiUrl() {
  return process.env.INTERNAL_API_URL || API_URL || "http://localhost:4000";
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("lomwong_token") || "";
}

export async function api(path, options = {}) {
  const token = options.token ?? getToken();
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function baht(value) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(Number(value || 0));
}
