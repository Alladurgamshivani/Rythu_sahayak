const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE = (configuredApiBase || (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(code, status = null) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function codeForStatus(status, auth) {
  if (status === 401) return auth ? "SESSION_EXPIRED" : "INVALID_CREDENTIALS";
  if (status === 403) return "REQUEST_ERROR";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "ALREADY_REVIEWED";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "REQUEST_ERROR";
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  if (!API_BASE) throw new ApiError("CONFIGURATION_ERROR");

  const headers = { "Content-Type": "application/json" };
  const token = sessionStorage.getItem("rythu_access_token");
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = codeForStatus(response.status, auth);
    if (response.status === 401 && auth) {
      sessionStorage.removeItem("rythu_access_token");
      window.dispatchEvent(new CustomEvent("rythu-session-expired"));
    }
    // Keep internal server details out of the public interface; the UI translates this code.
    throw new ApiError(code, response.status);
  }
  return payload;
}

function languageQuery(language) {
  return `?language=${encodeURIComponent(language === "te" ? "te" : "en")}`;
}

export const api = {
  login: (username, password) => request("/api/auth/login", {
    method: "POST", auth: false, body: { username, password },
  }),
  me: () => request("/api/auth/me"),
  dashboard: (language = "en") => request(`/api/dashboard${languageQuery(language)}`),
  applications: ({ search = "", status = "", attentionOnly = false, language = "en" } = {}) => {
    const params = new URLSearchParams();
    params.set("language", language === "te" ? "te" : "en");
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (attentionOnly) params.set("attention_only", "true");
    return request(`/api/applications?${params.toString()}`);
  },
  application: (id, language = "en") => request(`/api/applications/${encodeURIComponent(id)}${languageQuery(language)}`),
  analyze: (id, language = "en") => request(`/api/applications/${encodeURIComponent(id)}/analyze${languageQuery(language)}`, { method: "POST" }),
  decide: (id, action, reason) => request(`/api/applications/${encodeURIComponent(id)}/decision`, {
    method: "POST", body: { action, reason },
  }),
  history: (id) => request(`/api/applications/${encodeURIComponent(id)}/history`),
};
